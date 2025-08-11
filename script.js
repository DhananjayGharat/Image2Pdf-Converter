document.addEventListener('DOMContentLoaded', () => {
    // --- Destructuring & Element Selection ---
    const { jsPDF } = window.jspdf;
    const uploadZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('file-input');
    const imageListContainer = document.getElementById('image-list-container');
    const convertBtn = document.getElementById('convert-btn');
    const previewBtn = document.getElementById('preview-btn');
    const clearBtn = document.getElementById('clear-btn');
    const loader = document.getElementById('loader-overlay');
    const marginSlider = document.getElementById('page-margin');
    const marginValue = document.getElementById('margin-value');

    // --- State & Initialization ---
    new Sortable(imageListContainer, { animation: 150, ghostClass: 'sortable-ghost' });
    
    const actionButtons = [convertBtn, previewBtn, clearBtn];

    // --- Event Listeners ---
    uploadZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => handleFiles(fileInput.files));
    
    // Drag and Drop Listeners
    uploadZone.addEventListener('dragover', e => {
        e.preventDefault();
        uploadZone.classList.add('drag-over');
    });
    uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
    uploadZone.addEventListener('drop', e => {
        e.preventDefault();
        uploadZone.classList.remove('drag-over');
        handleFiles(e.dataTransfer.files);
    });

    // Image Deletion Listener (using event delegation)
    imageListContainer.addEventListener('click', e => {
        if (e.target.classList.contains('delete-btn')) {
            e.target.parentElement.remove();
            updateButtonStates();
        }
    });

    // Margin Slider Listener
    marginSlider.addEventListener('input', e => marginValue.textContent = e.target.value);
    
    // Button Listeners
    clearBtn.addEventListener('click', () => {
        imageListContainer.innerHTML = '';
        updateButtonStates();
        showToast('All images cleared!', 'success');
    });
    
    convertBtn.addEventListener('click', () => generatePdf('save'));
    previewBtn.addEventListener('click', () => generatePdf('preview'));


    // --- Core Functions ---
    const handleFiles = (files) => {
        const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
        Array.from(files).forEach(file => {
            if (allowedTypes.includes(file.type)) {
                const reader = new FileReader();
                reader.onload = e => createImageThumbnail(e.target.result);
                reader.readAsDataURL(file);
            }
        });
        updateButtonStates();
    };

    const createImageThumbnail = (src) => {
        const div = document.createElement('div');
        div.className = 'image-item';
        div.innerHTML = `
            <img src="${src}" alt="Uploaded image thumbnail">
            <button class="delete-btn" title="Remove image">&times;</button>
        `;
        imageListContainer.appendChild(div);
        updateButtonStates();
    };

    const generatePdf = async (outputType) => {
        const images = imageListContainer.querySelectorAll('.image-item img');
        if (images.length === 0) {
            showToast('Please upload at least one image.', 'error');
            return;
        }

        showLoader(true);

        // Allow UI to update before heavy processing
        await new Promise(resolve => setTimeout(resolve, 50));

        try {
            const pageSize = document.getElementById('page-size').value;
            const orientation = document.getElementById('page-orientation').value;
            const quality = document.getElementById('image-quality').value;
            const margin = parseInt(marginSlider.value, 10);
            let fileName = document.getElementById('file-name').value.trim() || 'converted-document';
            if (!fileName.toLowerCase().endsWith('.pdf')) {
                fileName += '.pdf';
            }

            const pdf = new jsPDF({ orientation, unit: 'mm', format: pageSize });
            
            images.forEach((img, index) => {
                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();
                const widthWithMargin = pageWidth - (margin * 2);
                const heightWithMargin = pageHeight - (margin * 2);
                
                const imgRatio = img.naturalWidth / img.naturalHeight;
                const pageRatio = widthWithMargin / heightWithMargin;

                let finalWidth, finalHeight;
                if (imgRatio > pageRatio) {
                    finalWidth = widthWithMargin;
                    finalHeight = finalWidth / imgRatio;
                } else {
                    finalHeight = heightWithMargin;
                    finalWidth = finalHeight * imgRatio;
                }
                
                const x = margin + (widthWithMargin - finalWidth) / 2;
                const y = margin + (heightWithMargin - finalHeight) / 2;
                
                if (index > 0) pdf.addPage();
                pdf.addImage(img, 'JPEG', x, y, finalWidth, finalHeight, undefined, quality);
            });
            
            if (outputType === 'save') {
                pdf.save(fileName);
                showToast('PDF downloaded successfully!', 'success');
            } else {
                pdf.output('dataurlnewwindow');
                showToast('PDF preview generated!', 'success');
            }

        } catch (error) {
            console.error("PDF Generation Error:", error);
            showToast('An error occurred during PDF generation.', 'error');
        } finally {
            showLoader(false);
        }
    };

    // --- UI Helper Functions ---
    const updateButtonStates = () => {
        const hasImages = imageListContainer.children.length > 0;
        actionButtons.forEach(btn => btn.disabled = !hasImages);
    };

    const showLoader = (show) => loader.classList.toggle('hidden', !show);
    
    const showToast = (message, type = 'success') => {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.getElementById('toast-container').appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    };
});
