/**
 * Gallery Configuration
 * Define all 360° videos available in the experience
 */

export const videoGallery = [
    {
        id: '4klatlong_05b_offsetOverture1',
        name: '4K Latlong - Overture',
        description: 'High-quality 4K 360° experience',
        folder: '4klatlong_05b_offsetOverture1',
        thumbnail: 'assets/videos/processed/4klatlong_05b_offsetOverture1/4klatlong_05b_offsetOverture1_thumb.jpg',
        duration: '5:35',
        tags: ['4k', 'equirectangular', 'high-quality']
    },
    {
        id: 'Scraptangle_latlong_05b_offsetOverture1',
        name: 'Scraptangle',
        description: 'Artistic 360° vision',
        folder: 'Scraptangle_latlong_05b_offsetOverture1',
        thumbnail: 'assets/videos/processed/Scraptangle_latlong_05b_offsetOverture1/Scraptangle_latlong_05b_offsetOverture1_thumb.jpg',
        duration: '',
        tags: ['artistic', 'experimental']
    },
    {
        id: 'ShroomZoomLatlong_12',
        name: 'Shroom Zoom',
        description: 'Immersive nature experience',
        folder: 'ShroomZoomLatlong_12',
        thumbnail: 'assets/videos/processed/ShroomZoomLatlong_12/ShroomZoomLatlong_12_thumb.jpg',
        duration: '',
        tags: ['nature', 'immersive']
    },
    {
        id: 'stumpy_latlong_01_waves_61Mbps-003',
        name: 'Stumpy Waves',
        description: 'Coastal 360° experience',
        folder: 'stumpy_latlong_01_waves_61Mbps-003',
        thumbnail: 'assets/videos/processed/stumpy_latlong_01_waves_61Mbps-003/stumpy_latlong_01_waves_61Mbps-003_thumb.jpg',
        duration: '',
        tags: ['coastal', 'nature', 'waves']
    }
];

/**
 * Get video by ID
 */
export function getVideoById(id) {
    return videoGallery.find(video => video.id === id);
}

/**
 * Get all video IDs
 */
export function getAllVideoIds() {
    return videoGallery.map(video => video.id);
}

/**
 * Get videos by tag
 */
export function getVideosByTag(tag) {
    return videoGallery.filter(video => video.tags.includes(tag));
}

/**
 * Get next video in gallery
 */
export function getNextVideo(currentId) {
    const currentIndex = videoGallery.findIndex(video => video.id === currentId);
    if (currentIndex === -1) return videoGallery[0];
    
    const nextIndex = (currentIndex + 1) % videoGallery.length;
    return videoGallery[nextIndex];
}

/**
 * Get previous video in gallery
 */
export function getPreviousVideo(currentId) {
    const currentIndex = videoGallery.findIndex(video => video.id === currentId);
    if (currentIndex === -1) return videoGallery[videoGallery.length - 1];
    
    const prevIndex = currentIndex === 0 ? videoGallery.length - 1 : currentIndex - 1;
    return videoGallery[prevIndex];
}

export default videoGallery;
