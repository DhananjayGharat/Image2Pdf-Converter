// Wait for the DOM to be fully loaded before running the script
window.addEventListener('DOMContentLoaded', () => {
    // Destructure jsPDF from the global window object
    const { jsPDF } = window.jspdf;

    // Get references to key DOM elements
    const fileInput = document.getElementById('file-input');
    const imageListContainer = document.getElementById('image-list-container');
    const convertBtn = document.getElementById('convert-btn');

    // Initialize SortableJS on the image container
    new Sortable(imageListContainer, {
        animation: 150, // Animation speed
        ghostClass: 'sortable-ghost' // Class for the visual placeholder
    });

    // --- Event Listener for File Input ---
    fileInput.addEventListener('change', (event) => {
        const files = event.target.files;
        if (files.length === 0) return;

        // Process each selected file
        Array.from(files).forEach(file => {
            // Ensure the file is a PNG image
            if (file.type === "image/png") {
                const reader = new FileReader();

                // When the file is read, create a thumbnail
                reader.onload = function(e) {
                    const imageItem = document.createElement('div');
                    imageItem.className = 'image-item';
                    
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    
                    imageItem.appendChild(img);
                    imageListContainer.appendChild(imageItem);
                };
                // Read the file as a Data URL
                reader.readAsDataURL(file);
            }
        });
        // Enable the convert button once images are added
        convertBtn.disabled = false;
    });

    // --- Event Listener for the Convert Button ---
    convertBtn.addEventListener('click', () => {
        // Get all image elements in their current, possibly reordered, sequence
        const images = imageListContainer.querySelectorAll('.image-item img');
        if (images.length === 0) {
            alert('Please upload at least one PNG image.');
            return;
        }

        // Get selected PDF options from radio buttons
        const orientation = document.querySelector('input[name="orientation"]:checked').value;
        const pageSize = document.querySelector('input[name="size"]:checked').value;

        // Provide user feedback during conversion
        convertBtn.disabled = true;
        convertBtn.textContent = 'Converting...';

        try {
            // Initialize a new jsPDF document with user-selected options
            const pdf = new jsPDF({
                orientation: orientation,
                unit: 'mm',
                format: pageSize
            });

            // Process each image and add it to the PDF
            images.forEach((img, index) => {
                // Add a new page for each image after the first one
                if (index > 0) {
                    pdf.addPage(pageSize, orientation);
                }

                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();
                
                // Calculate image dimensions to fit the page while maintaining aspect ratio
                const imgWidth = img.naturalWidth;
                const imgHeight = img.naturalHeight;
                const pageRatio = pageWidth / pageHeight;
                const imgRatio = imgWidth / imgHeight;

                let finalWidth, finalHeight;
                if (imgRatio > pageRatio) {
                    // If the image is wider than the page, fit to width
                    finalWidth = pageWidth;
                    finalHeight = pageWidth / imgRatio;
                } else {
                    // If the image is taller or same ratio, fit to height
                    finalHeight = pageHeight;
                    finalWidth = pageHeight * imgRatio;
                }

                // Center the image on the page
                const x = (pageWidth - finalWidth) / 2;
                const y = (pageHeight - finalHeight) / 2;
                
                // Add the image to the PDF
                pdf.addImage(img.src, 'PNG', x, y, finalWidth, finalHeight);
            });

            // Trigger the download of the generated PDF
            pdf.save('converted-images.pdf');

        } catch (error) {
            console.error('An error occurred during PDF generation:', error);
            alert('An error occurred. Please check the console and try again.');
        } finally {
            // Reset the button to its original state
            convertBtn.disabled = false;
            convertBtn.textContent = 'Convert to PDF';
        }
    });
});