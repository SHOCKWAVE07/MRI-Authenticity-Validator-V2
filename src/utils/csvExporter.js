/**
 * Exports the results to a CSV file.
 * @param {Array} results - Array of result objects.
 * @param {string} filename - The filename to save as.
 */
export function exportResultsToCSV(results, filename = 'results.csv') {
    if (!results || results.length === 0) {
        console.warn("No results to export.");
        return;
    }

    const headers = [
        "UserID",
        "Phase",
        "CaseID",
        "TargetShown",
        "Rating",
        "ResponseTime_ms",
        "Timestamp"
    ];

    const csvRows = [
        headers.join(','), // Header row
        ...results.map(row => {
            return headers.map(header => {
                const val = row[header] !== undefined ? row[header] : "";
                // Escape quotes if needed
                return `"${String(val).replace(/"/g, '""')}"`;
            }).join(',');
        })
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
