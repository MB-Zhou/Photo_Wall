const imageContainer = document.getElementById('gallery');
const itemsPerPage = 18; // 每页显示数量
let currentPage = 0;
let isLoading = false;
let currentImageIndex = 0;
let loadedImages = [];
let leftArrow;
let rightArrow;
let loadMoreBtn = null;

// Calculate the number of days since the start date
function calculateLoveDays() {
    const startDate = new Date('2025-02-22'); // **Love date - 修改这里的日期**
    const today = new Date();
    startDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const timeDiff = today - startDate;
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    document.getElementById('loveDays').innerText = days;
}

// 分页加载函数
async function loadImagesByPage() {
    if (isLoading) return;
    isLoading = true;
    
    // 显示加载指示器
    showLoadingIndicator();
    
    const startIndex = currentPage * itemsPerPage;
    
    try {
        const promises = [];
        // 一次加载一页的所有图片
        for (let i = 0; i < itemsPerPage; i++) {
            promises.push(loadThumbnail(startIndex + i));
        }
        
        const results = await Promise.all(promises);
        
        // 过滤掉null（图片不存在的情况）
        const validImages = results.filter(img => img !== null);
        
        if (validImages.length === 0) {
            // 没有更多图片了
            showNoMoreImagesMessage();
            hideLoadingIndicator();
            isLoading = false;
            return;
        }
        
        // 添加到页面
        validImages.forEach(img => {
            if (img) {
                imageContainer.appendChild(img);
                // 延迟加载效果
                setTimeout(() => {
                    img.classList.add('loaded');
                }, 50);
            }
        });
        
        currentPage++;
        
        // 如果加载的图片少于itemsPerPage，可能没有更多图片了
        if (validImages.length < itemsPerPage) {
            showNoMoreImagesMessage();
        }
        
    } catch (error) {
        console.error('加载图片失败:', error);
        showErrorMessage();
    } finally {
        isLoading = false;
        hideLoadingIndicator();
    }
}

// 显示加载指示器
function showLoadingIndicator() {
    const existingLoader = document.getElementById('loadingIndicator');
    if (existingLoader) return;
    
    const loader = document.createElement('div');
    loader.id = 'loadingIndicator';
    loader.innerHTML = `
        <div style="text-align: center; padding: 20px; grid-column: 1 / -1;">
            <div class="spinner"></div>
            <p style="margin-top: 10px; color: #666; font-size: 14px;">加载照片中...</p>
        </div>
    `;
    imageContainer.appendChild(loader);
}

function hideLoadingIndicator() {
    const loader = document.getElementById('loadingIndicator');
    if (loader) {
        loader.remove();
    }
}

function showNoMoreImagesMessage() {
    if (loadMoreBtn) {
        loadMoreBtn.textContent = '没有更多照片了';
        loadMoreBtn.disabled = true;
        loadMoreBtn.style.opacity = '0.6';
        loadMoreBtn.style.cursor = 'not-allowed';
        loadMoreBtn.onclick = null;
    }
}

function showErrorMessage() {
    if (loadMoreBtn) {
        const originalText = loadMoreBtn.textContent;
        loadMoreBtn.textContent = '加载失败，点击重试';
        loadMoreBtn.style.background = 'linear-gradient(135deg, #ff4757, #ff3838)';
        
        // 3秒后恢复原状
        setTimeout(() => {
            loadMoreBtn.textContent = originalText;
            loadMoreBtn.style.background = 'linear-gradient(135deg, #ff6b6b, #ee5a24)';
        }, 3000);
    }
}

// Load a thumbnail image and create an image element
function loadThumbnail(index) {
    return new Promise((resolve) => {
        const thumbImg = new Image();
        thumbImg.crossOrigin = 'Anonymous';
        thumbImg.src = `images/thumbs/${index}.jpg`;

        thumbImg.onload = function () {
            createImageElement(thumbImg, index, resolve);
        };

        // If the thumbnail image fails to load, try loading the full-size image
        thumbImg.onerror = function () {
            thumbImg.src = `images/${index}.jpg`;
            thumbImg.onload = function () {
                createImageElement(thumbImg, index, resolve);
            };
            thumbImg.onerror = function () {
                // 如果原始图片也不存在，返回null
                resolve(null);
            };
        };

        function createImageElement(thumbImg, index, resolve) {
            const imgElement = document.createElement('img');
            imgElement.dataset.large = `images/${index}.jpg`;
            imgElement.src = thumbImg.src;
            imgElement.alt = `Image ${index}`;
            imgElement.setAttribute('data-date', '');
            imgElement.setAttribute('data-index', index);
            imgElement.classList.add('thumbnail');

            EXIF.getData(thumbImg, function () {
                let exifDate = EXIF.getTag(this, 'DateTimeOriginal');
                if (exifDate) {
                    exifDate = exifDate.replace(/^(\d{4}):(\d{2}):(\d{2}).*$/, '$1.$2.$3');
                } else {
                    exifDate = '';
                }
                imgElement.setAttribute('data-date', exifDate);

                loadedImages[index] = {
                    src: imgElement.dataset.large,
                    date: exifDate,
                };
            });

            imgElement.addEventListener('click', function () {
                showPopup(imgElement.dataset.large, imgElement.getAttribute('data-date'), index);
            });

            imgElement.style.cursor = 'pointer';
            
            // 错误处理：如果图片加载失败，显示占位图
            imgElement.onerror = function() {
                this.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect width="200" height="200" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" font-family="Arial" font-size="14" fill="%23999" text-anchor="middle" dy=".3em"%3E图片加载失败%3C/text%3E%3C/svg%3E';
            };

            resolve(imgElement);
        }
    });
}

// 添加加载更多按钮
function addLoadMoreButton() {
    // 移除已存在的按钮
    const existingBtn = document.getElementById('loadMoreBtn');
    if (existingBtn) existingBtn.remove();
    
    loadMoreBtn = document.createElement('button');
    loadMoreBtn.id = 'loadMoreBtn';
    loadMoreBtn.textContent = '加载更多照片';
    loadMoreBtn.className = 'load-more-btn';
    
    loadMoreBtn.addEventListener('click', () => {
        if (!isLoading) {
            loadImagesByPage();
        }
    });
    
    // 添加到页面底部
    const mainElement = document.querySelector('main');
    if (mainElement) {
        mainElement.appendChild(loadMoreBtn);
    } else {
        document.body.appendChild(loadMoreBtn);
    }
}

// Display a popup with the full-size image
function showPopup(src, date, index) {
    currentImageIndex = index;
    const popup = document.getElementById('popup');
    const popupImg = document.getElementById('popupImg');
    const imgDate = document.getElementById('imgDate');

    popup.style.display = 'block';

    popupImg.style.display = 'none';
    imgDate.innerText = '';

    const fullImg = new Image();
    fullImg.crossOrigin = 'Anonymous';
    fullImg.src = src;

    fullImg.onload = function () {
        popupImg.src = src;
        popupImg.style.display = 'block';
        imgDate.innerText = date;
        
        // 添加图片加载完成动画
        popupImg.style.opacity = '0';
        setTimeout(() => {
            popupImg.style.transition = 'opacity 0.3s ease';
            popupImg.style.opacity = '1';
        }, 10);
    };

    fullImg.onerror = function () {
        imgDate.innerText = '图片加载失败';
        popupImg.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"%3E%3Crect width="400" height="400" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" font-family="Arial" font-size="16" fill="%23999" text-anchor="middle" dy=".3em"%3E图片无法加载%3C/text%3E%3C/svg%3E';
        popupImg.style.display = 'block';
    };

    leftArrow.style.display = 'flex';
    rightArrow.style.display = 'flex';

    if (currentImageIndex > 0) {
        leftArrow.classList.remove('disabled');
    } else {
        leftArrow.classList.add('disabled');
    }

    if (loadedImages[currentImageIndex + 1]) {
        rightArrow.classList.remove('disabled');
    } else {
        rightArrow.classList.add('disabled');
    }
}

// Close the popup
function closePopup() {
    const popup = document.getElementById('popup');
    const popupImg = document.getElementById('popupImg');
    const imgDate = document.getElementById('imgDate');
    popup.style.display = 'none';
    popupImg.src = '';
    imgDate.innerText = '';

    leftArrow.style.display = 'none';
    rightArrow.style.display = 'none';
}

// Show the previous image in the popup (when the left arrow is clicked)
function showPreviousImage() {
    const prevIndex = currentImageIndex - 1;
    if (prevIndex >= 0) {
        if (loadedImages[prevIndex]) {
            currentImageIndex = prevIndex;
            const imgData = loadedImages[prevIndex];
            showPopup(imgData.src, imgData.date, prevIndex);
        } else {
            leftArrow.classList.add('disabled');
        }
    }
}

// Show the next image in the popup (when the right arrow is clicked)
function showNextImage() {
    const nextIndex = currentImageIndex + 1;
    if (loadedImages[nextIndex]) {
        currentImageIndex = nextIndex;
        const imgData = loadedImages[nextIndex];
        showPopup(imgData.src, imgData.date, nextIndex);
    } else {
        rightArrow.classList.add('disabled');
    }
}

// Keyboard navigation for the popup
window.addEventListener('keydown', function (event) {
    const popup = document.getElementById('popup');
    if (popup.style.display === 'block') {
        if (event.key === 'ArrowLeft') {
            showPreviousImage();
        } else if (event.key === 'ArrowRight') {
            showNextImage();
        } else if (event.key === 'Escape') {
            closePopup();
        }
    }
});

// Load the initial images and set up event listeners
window.onload = function () {
    calculateLoveDays();

    // 初始加载第一页
    loadImagesByPage();
    
    // 添加"加载更多"按钮
    addLoadMoreButton();

    document.getElementById('closeBtn').addEventListener('click', closePopup);

    leftArrow = document.getElementById('leftArrow');
    rightArrow = document.getElementById('rightArrow');

    leftArrow.addEventListener('click', showPreviousImage);
    rightArrow.addEventListener('click', showNextImage);

    leftArrow.style.display = 'none';
    rightArrow.style.display = 'none';
    
    // 点击popup背景关闭
    document.getElementById('popup').addEventListener('click', function(e) {
        if (e.target === this) {
            closePopup();
        }
    });
};