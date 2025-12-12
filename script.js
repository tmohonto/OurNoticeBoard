// Auth Guard
if (!sessionStorage.getItem('isLoggedIn')) {
    window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const themeBtn = document.getElementById('themeToggle');
    const selectImgBtn = document.getElementById('selectImgBtn');
    const imageInput = document.getElementById('imageInput');
    const postBtn = document.getElementById('postBtn');
    const descInput = document.getElementById('descInput');
    const previewArea = document.getElementById('previewArea');
    const imgPreview = document.getElementById('imgPreview');
    const removePreviewBtn = document.getElementById('removePreview');
    const userPostsContainer = document.getElementById('userPosts');

    // Constants
    const STORAGE_KEY = 'notice_board_posts';
    const THEME_KEY = 'notice_board_theme';

    // Theme Initialization
    const savedTheme = localStorage.getItem(THEME_KEY);
    // Default to dark mode if no preference (since user liked dark originally) OR check system pref?
    // Let's default to Day as it's "Refreshing" usually, but check preference.
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }

    themeBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    });

    // State
    let currentFile = null;

    // Initialize posts
    loadPosts();

    // Event: Click "Add Photo" -> Trigger File Input
    selectImgBtn.addEventListener('click', () => {
        imageInput.click();
    });

    // Event: File Selected
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            handleFileSelect(file);
        }
    });

    // Event: Remove Preview
    removePreviewBtn.addEventListener('click', () => {
        clearPreview();
    });

    // Event: Post
    postBtn.addEventListener('click', () => {
        handlePost();
    });

    // Helper: Handle File Selection (Show Preview)
    function handleFileSelect(file) {
        currentFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            imgPreview.src = e.target.result;
            previewArea.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }

    // Helper: Clear Preview/Input
    function clearPreview() {
        currentFile = null;
        imageInput.value = '';
        previewArea.classList.add('hidden');
        imgPreview.src = '';
    }

    // Helper: Reset Form
    function resetForm() {
        clearPreview();
        descInput.value = '';
    }

    // Core: Handle Post Creation
    function handlePost() {
        // Validation: Need at least an image OR text (but user asked mainly for image site)
        // Let's require image for this visual board, text optional.
        if (!currentFile) {
            if (!descInput.value.trim()) {
                alert('Please add a photo or description.');
                return;
            }
            // If just text, we can support that too, but let's prioritize image based on prompt.
        }

        const description = descInput.value.trim();
        const timestamp = new Date();

        if (currentFile) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageData = e.target.result;
                const post = {
                    id: timestamp.getTime(),
                    type: 'image',
                    src: imageData,
                    description: description,
                    date: timestamp.toLocaleDateString(),
                    time: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
                savePost(post);
                renderPost(post, true); // true = prepend (top of feed)
                resetForm();
            };
            reader.readAsDataURL(currentFile);
        } else {
            // Text only post
            const post = {
                id: timestamp.getTime(),
                type: 'text',
                description: description,
                date: timestamp.toLocaleDateString(),
                time: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            savePost(post);
            renderPost(post, true);
            resetForm();
        }
    }

    // Core: Save to LocalStorage
    function savePost(post) {
        let posts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        posts.unshift(post); // Add to beginning
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
        } catch (err) {
            console.error('Storage full or error', err);
            alert('Storage is full. Some older posts might be needed to clear space.');
        }
    }

    // Core: Load from LocalStorage
    function loadPosts() {
        const posts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        userPostsContainer.innerHTML = '';
        posts.forEach(post => renderPost(post, false));
    }

    // Core: Render Single Post
    function renderPost(post, isNew) {
        const article = document.createElement('article');
        article.className = 'post-card user-post';

        // Avatar Letter (Randomish or fixed 'U' for User)
        const avatarLetter = 'U';

        let contentHtml = '';

        // Text Content
        if (post.description) {
            contentHtml += `<div class="post-content"><p>${escapeHtml(post.description)}</p></div>`;
        }

        // Image Content
        if (post.src) {
            contentHtml += `<div class="post-image"><img src="${post.src}" alt="User Post"></div>`;
        }

        article.innerHTML = `
            <div class="post-header">
                <div class="avatar">👩‍❤️‍👨</div>
                <div class="meta">
                    <span class="username">Our</span>
                    <span class="time">${post.date} at ${post.time}</span>
                </div>
            </div>
            ${contentHtml}
        `;

        // Double click to delete
        article.addEventListener('dblclick', () => {
            if (confirm('Delete this post?')) {
                deletePost(post.id);
                article.remove();
            }
        });

        if (isNew) {
            userPostsContainer.prepend(article);
        } else {
            userPostsContainer.appendChild(article);
        }
    }

    function deletePost(id) {
        let posts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        posts = posts.filter(p => p.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    }

    // Utility: XSS prevent
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // --- Lightbox Logic ---
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxClose = document.querySelector('.lightbox-close');

    // Open Lightbox (Delegate event to handle static & dynamic posts)
    document.body.addEventListener('click', (e) => {
        if (e.target.tagName === 'IMG' && e.target.closest('.post-image')) {
            lightboxImg.src = e.target.src;
            lightbox.classList.remove('hidden');
        }
    });

    // Close Lightbox
    lightboxClose.addEventListener('click', () => {
        lightbox.classList.add('hidden');
        lightboxImg.src = '';
    });

    // Close on Outside Click
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            lightbox.classList.add('hidden');
            lightboxImg.src = '';
        }
    });
});
