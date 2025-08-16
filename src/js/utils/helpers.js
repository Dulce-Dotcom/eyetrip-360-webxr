export function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function isVRSupported() {
    return 'xr' in navigator;
}

export function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function getVideoQuality() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (connection) {
        const effectiveType = connection.effectiveType;
        switch(effectiveType) {
            case '4g':
                return 'high';
            case '3g':
                return 'medium';
            default:
                return 'low';
        }
    }
    
    return 'medium';
}
