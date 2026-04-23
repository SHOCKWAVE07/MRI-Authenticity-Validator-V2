/**
 * Loads the manifest JSON.
 * For now, this fetches a local file in public/ or returns a static object.
 */
export async function loadManifest(url = '/demo_manifest.json') {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load manifest: ${response.statusText}`);
        }
        const data = await response.json();

        // Validate structure
        if (!data.warmup || !data.test) {
            throw new Error("Manifest missing 'warmup' or 'test' arrays.");
        }

        return data;
    } catch (error) {
        console.error("Manifest load error:", error);
        throw error;
    }
}
