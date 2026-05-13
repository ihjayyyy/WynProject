
  const handleOpenPdf = async (data) => {
    try {
              var blob = await data.blob();
              console.log(blob)
       const fileType = blob.type;
       console.log(data)
      if (!fileType || !fileType.includes("pdf")) {
        throw new Error("The file received is not a PDF.");
      }
      // Create a Blob URL

      const fileURL = URL.createObjectURL(blob, { type: fileType });

      // Open PDF in a new browser tab
      window.open(fileURL, "_blank", "noopener,noreferrer");

      // Optional: Revoke the object URL after some time to free memory
      setTimeout(() => URL.revokeObjectURL(fileURL), 10000);
    } catch (error) {
      console.error("Error fetching PDF:", error);
      alert("Failed to load PDF. Please try again.");
    }
  }

export { handleOpenPdf };
export default { handleOpenPdf };