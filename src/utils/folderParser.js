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
 * - In each directory, look for files answering to 'input', 'acquired', 'synth', 'target'.
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

        let input, acquired, synth, target;

        // ID is usually the directory name
        const id = dirPath.split('/').pop() || `case_${Math.random().toString(36).substr(2, 5)}`;

        group.forEach(item => {
            const name = item.filename.toLowerCase();
            // Extract modality: last part after underscore, before extension
            // e.g. "case1_acquired_T1.png" -> "T1"
            const nameWithoutExt = item.filename.substring(0, item.filename.lastIndexOf('.'));
            const parts = nameWithoutExt.split('_');
            const modality = parts.length > 1 ? parts[parts.length - 1] : '';

            item.modality = modality;

            if (name.includes('input') || name.includes('source')) input = item;
            else if (name.includes('target')) target = item;
            else if (name.includes('acquired') || name.includes('real')) acquired = item;
            else if (name.includes('synth') || name.includes('generated') || name.includes('fake')) synth = item;
        });

        // Warmup: Supports both 3-file (input, acquired, synth) and 2-file (input, target_*) structure
        if (phase === 'warmup') {
            if (input && (target || (acquired && synth))) {
                const isBlinded = !!target;
                let targetType = 'BLINDED';
                if (isBlinded) {
                    if (target.filename.toLowerCase().includes('acquired')) targetType = 'Acquired';
                    else if (target.filename.toLowerCase().includes('synth')) targetType = 'Synthetic';
                }

                manifest.warmup.push({
                    id,
                    input: getUrl(input.blob),
                    acquired: acquired ? getUrl(acquired.blob) : null,
                    synthetic: synth ? getUrl(synth.blob) : null,
                    target: target ? getUrl(target.blob) : null,
                    targetType: targetType,
                    inputModality: input.modality,
                    acquiredModality: acquired ? acquired.modality : '',
                    syntheticModality: synth ? synth.modality : '',
                    targetModality: target ? target.modality : ''
                });
            }
        }
        // Test: Needs Input + Target
        else if (phase === 'test') {
            const actualTarget = target || acquired || synth;
            if (input && actualTarget) {
                manifest.test.push({
                    id,
                    input: getUrl(input.blob),
                    target: getUrl(actualTarget.blob),
                    inputModality: input.modality,
                    targetModality: actualTarget.modality
                    // No acquired/synth here, blind!
                });
            }
        }
    });

    return manifest;
}
