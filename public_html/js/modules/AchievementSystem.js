/**
 * AchievementSystem.js
 * Gamification system for EyeTrip VR
 * Tracks user progress and unlocks achievements
 */

export class AchievementSystem {
    constructor() {
        this.achievements = {
            'first_discovery': {
                id: 'first_discovery',
                title: '🔍 First Discovery',
                description: 'Found your first hidden sound',
                unlocked: false
            },
            'halfway_there': {
                id: 'halfway_there',
                title: '🎵 Halfway There',
                description: 'Collected 5 sounds',
                unlocked: false
            },
            'sound_collector': {
                id: 'sound_collector',
                title: '🎶 Sound Collector',
                description: 'Found 8 sounds',
                unlocked: false
            },
            'completionist': {
                id: 'completionist',
                title: '✨ Completionist',
                description: 'Found all sounds in one experience',
                unlocked: false
            },
            'explorer': {
                id: 'explorer',
                title: '🌍 Explorer',
                description: 'Visited all 4 experiences',
                unlocked: false
            },
            'vr_pioneer': {
                id: 'vr_pioneer',
                title: '🥽 VR Pioneer',
                description: 'Entered VR mode',
                unlocked: false
            }
        };
        
        this.notificationQueue = [];
        this.isShowingNotification = false;
        
        this.loadProgress();
        console.log('🏆 Achievement System initialized');
    }
    
    /**
     * Unlock an achievement
     */
    unlock(achievementId) {
        const achievement = this.achievements[achievementId];
        
        if (!achievement) {
            console.warn(`Unknown achievement: ${achievementId}`);
            return;
        }
        
        if (achievement.unlocked) {
            console.log(`Achievement already unlocked: ${achievementId}`);
            return;
        }
        
        // Unlock it
        achievement.unlocked = true;
        localStorage.setItem(`eyetripvr_achievement_${achievementId}`, 'true');
        
        console.log(`🎉 Achievement unlocked: ${achievement.title}`);
        
        // Show notification
        this.showNotification(achievement);
        
        // Track with analytics
        if (window.trackVREvent) {
            window.trackVREvent('achievement_unlocked', achievementId, 1);
        }
    }
    
    /**
     * Show achievement notification
     */
    showNotification(achievement) {
        // Add to queue
        this.notificationQueue.push(achievement);
        
        // If not currently showing a notification, start processing queue
        if (!this.isShowingNotification) {
            this.processNotificationQueue();
        }
    }
    
    /**
     * Process notification queue one at a time
     */
    processNotificationQueue() {
        if (this.notificationQueue.length === 0) {
            this.isShowingNotification = false;
            return;
        }
        
        this.isShowingNotification = true;
        const achievement = this.notificationQueue.shift();
        
        console.log(`🔔 Showing achievement notification: ${achievement.title}`);
        
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-icon">🏆</div>
            <div class="achievement-content">
                <div class="achievement-label">Achievement Unlocked!</div>
                <div class="achievement-title">${achievement.title}</div>
                <div class="achievement-desc">${achievement.description}</div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Animate out and remove, then process next in queue
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
                // Process next notification after a short delay
                setTimeout(() => this.processNotificationQueue(), 500);
            }, 300);
        }, 4000);
    }
    
    /**
     * Load progress from localStorage
     */
    loadProgress() {
        Object.keys(this.achievements).forEach(id => {
            if (localStorage.getItem(`eyetripvr_achievement_${id}`) === 'true') {
                this.achievements[id].unlocked = true;
            }
        });
    }
    
    /**
     * Get progress summary
     */
    getProgress() {
        const total = Object.keys(this.achievements).length;
        const unlocked = Object.values(this.achievements).filter(a => a.unlocked).length;
        const percentage = Math.round((unlocked / total) * 100);
        
        return { unlocked, total, percentage };
    }
    
    /**
     * Get all achievements (for display)
     */
    getAll() {
        return Object.values(this.achievements);
    }
    
    /**
     * Reset all achievements (for testing)
     */
    reset() {
        Object.keys(this.achievements).forEach(id => {
            this.achievements[id].unlocked = false;
            localStorage.removeItem(`eyetripvr_achievement_${id}`);
        });
        console.log('🔄 All achievements reset');
    }
    
    /**
     * Track visited experience
     */
    trackExperienceVisit(experienceName) {
        // Store visited experiences
        const visited = JSON.parse(localStorage.getItem('eyetripvr_visited_experiences') || '[]');
        
        if (!visited.includes(experienceName)) {
            visited.push(experienceName);
            localStorage.setItem('eyetripvr_visited_experiences', JSON.stringify(visited));
            
            // Check if all 4 experiences visited
            if (visited.length >= 4) {
                this.unlock('explorer');
            }
        }
    }
}
