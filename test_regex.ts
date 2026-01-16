
function extractFilePathFromUrl(fileUrl: string): string | null {
    try {
        const publicPattern = /\/storage\/v1\/object\/public\/[^/]+\/(.+)$/;
        const publicMatch = fileUrl.match(publicPattern);

        if (publicMatch && publicMatch[1]) {
            return decodeURIComponent(publicMatch[1]);
        }
        return null;
    } catch (error) {
        return null;
    }
}

const urls = [
    "https://xyz.supabase.co/storage/v1/object/public/attachments/work-orders/1736500000-abc.jpg",
    "https://xyz.supabase.co/storage/v1/object/public/attachments/folder/subfolder/file.png",
    "https://custom-domain.com/storage/v1/object/public/my-bucket/image.jpg"
];

urls.forEach(url => {
    console.log(`URL: ${url}`);
    console.log(`Path: ${extractFilePathFromUrl(url)}`);
    console.log("---");
});
