import JSZip from 'jszip';

/**
 * Parses a ZIP file into a Manifest.
 * 
 * Expected structure variants:
 * 1. Root/warmup/case_id/... & Root/test/case_id/...
 * 2. Flat list with filenames indicating phase and type.
 * 
 * We will assume a structure where Phase is a directory name (warmup/test)
 * and within that, we look for triplets.
 * 
 * Heuristic:
 * - Filter images (png, jpg, jpeg, bmp, tiff).
 * - Split path. Look for 'warmup' or 'test' in path segments.
 * - Group by directory.
 * - In each directory, look for files answering to 'input', 'real', 'synth', 'target'.
 */
export async function parseFolder(zipFile) {
    const manifest = {
        warmup: [],
        test: []
    };

    const zip = await JSZip.loadAsync(zipFile);
    const dirMap = new Map(); // path -> [file, file...]
    const filePromises = [];

    zip.forEach((relativePath, zipEntry) => {
        if (zipEntry.dir) return;
        if (!/\.(png|jpg|jpeg|bmp|tiff|tif)$/i.test(relativePath)) return;

        const parts = relativePath.split('/');
        const filename = parts.pop();
        const dirPath = parts.join('/');

        if (!dirMap.has(dirPath)) dirMap.set(dirPath, []);
        
        const promise = zipEntry.async('blob').then(blob => {
            dirMap.get(dirPath).push({ blob, filename, path: relativePath });
        });
        filePromises.push(promise);
    });

    await Promise.all(filePromises);

    const getUrl = (blob) => URL.createObjectURL(blob);

    // Process groups
    dirMap.forEach((group, dirPath) => {
        // Determine phase
        const lowerPath = dirPath.toLowerCase();
        let phase = null;
        if (lowerPath.includes('warmup')) phase = 'warmup';
        else if (lowerPath.includes('test')) phase = 'test';

        if (!phase) return; // Skip if not in known phase folder

        let input, real, synth, target;

        // ID is usually the directory name
        const id = dirPath.split('/').pop() || `case_${Math.random().toString(36).substr(2, 5)}`;

        group.forEach(item => {
            const name = item.filename.toLowerCase();
            // Extract modality: last part after underscore, before extension
            // e.g. "case1_real_T1.png" -> "T1"
            const nameWithoutExt = item.filename.substring(0, item.filename.lastIndexOf('.'));
            const parts = nameWithoutExt.split('_');
            const modality = parts.length > 1 ? parts[parts.length - 1] : '';

            item.modality = modality;

            if (name.includes('input') || name.includes('source')) input = item;
            else if (name.includes('real')) real = item;
            else if (name.includes('synth') || name.includes('generated') || name.includes('fake')) synth = item;
            else if (name.includes('target')) target = item;
        });

        // Warmup: Needs Input + (Real AND Synth) OR (Input + Target + TruthMetadata? No, prompt says retain all 3)
        // Admin Portal puts input, real, synthetic in warmup.
        if (phase === 'warmup') {
            if (input && real && synth) {
                manifest.warmup.push({
                    id,
                    input: getUrl(input.blob),
                    real: getUrl(real.blob),
                    synthetic: getUrl(synth.blob),
                    inputModality: input.modality,
                    realModality: real.modality,
                    syntheticModality: synth.modality
                });
            }
        }
        // Test: Needs Input + Target
        else if (phase === 'test') {
            // Supports Blinded (input + target) OR Unblinded Triplets (fallback/dev mode)
            if (input && target) {
                manifest.test.push({
                    id,
                    input: getUrl(input.blob),
                    target: getUrl(target.blob),
                    inputModality: input.modality,
                    targetModality: target.modality
                    // No real/synth here, blind!
                });
            }
            // Fallback for dev: if we have real/synth but no target, maybe we want to use them? 
            // But strictly speaking, the expert package has target.
        }
    });

    return manifest;
}
