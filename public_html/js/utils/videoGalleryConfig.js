/**
 * Gallery Configuration
 * Define all 360° videos available in the experience
 */

/**
 * Narrative stories for each experience
 * These create emotional context and set expectations
 */
export const videoNarratives = {
    'matrixCaracasSphere_1': {
        title: 'The Digital Matrix',
        story: 'Discover the hidden frequencies of the digital realm...',
        mission: 'The code speaks in patterns. Listen closely and you\'ll hear the symphony of data flowing through the matrix.',
        emoji: '🌐'
    },
    'Scraptangle_latlong_05b_offsetOverture1': {
        title: 'Symphony of Machines',
        story: 'Uncover the symphony within the machine...',
        mission: 'In the heart of industrial chaos lies a hidden orchestra. Each sound tells the story of creation and destruction.',
        emoji: '⚙️'
    },
    'ShroomZoomLatlong_12': {
        title: 'Mycelial Whispers',
        story: 'Find the whispers of the mycelial network...',
        mission: 'Beneath the surface, an ancient network communicates. Tune into the frequencies of nature\'s internet.',
        emoji: '🍄'
    },
    'stumpy_latlong_01_waves_61Mbps-003': {
        title: 'Ocean\'s Secrets',
        story: 'Hear the ocean\'s secret messages...',
        mission: 'The waves carry more than water—they carry songs from the deep. Discover what the ocean has been trying to tell us.',
        emoji: '🌊'
    },
    '4klatlong_05b_offsetOverture1': {
        title: 'Epic Overture',
        story: 'Experience the crescendo of reality...',
        mission: 'A grand composition unfolds before you. Each hidden sound builds toward an unforgettable climax.',
        emoji: '🎭'
    }
};

export const videoGallery = [
    {
        id: '4klatlong_05b_offsetOverture1',
        name: '4K Latlong - Overture',
        description: 'High-quality 4K 360° experience',
        narrative: videoNarratives['4klatlong_05b_offsetOverture1'],
        folder: '4klatlong_05b_offsetOverture1',
        thumbnail: 'assets/videos/processed/4klatlong_05b_offsetOverture1/4klatlong_05b_offsetOverture1_thumb.jpg',
        duration: '5:35',
        tags: ['4k', 'equirectangular', 'high-quality']
    },
    {
        id: 'Scraptangle_latlong_05b_offsetOverture1',
        name: 'Scraptangle',
        description: 'Artistic 360° vision',
        narrative: videoNarratives['Scraptangle_latlong_05b_offsetOverture1'],
        folder: 'Scraptangle_latlong_05b_offsetOverture1',
        thumbnail: 'assets/videos/processed/Scraptangle_latlong_05b_offsetOverture1/Scraptangle_latlong_05b_offsetOverture1_thumb.jpg',
        duration: '',
        tags: ['artistic', 'experimental']
    },
    {
        id: 'ShroomZoomLatlong_12',
        name: 'Shroom Zoom',
        description: 'Immersive nature experience',
        narrative: videoNarratives['ShroomZoomLatlong_12'],
        folder: 'ShroomZoomLatlong_12',
        thumbnail: 'assets/videos/processed/ShroomZoomLatlong_12/ShroomZoomLatlong_12_thumb.jpg',
        duration: '',
        tags: ['nature', 'immersive']
    },
    {
        id: 'stumpy_latlong_01_waves_61Mbps-003',
        name: 'Stumpy Waves',
        description: 'Coastal 360° experience',
        narrative: videoNarratives['stumpy_latlong_01_waves_61Mbps-003'],
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
