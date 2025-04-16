import { InstagramStats } from '@/lib/processors';

interface StatsDisplayProps {
    stats: InstagramStats;
}

const formatDate = (date: Date | string): string => {
    // Handle potential string dates from JSON parsing if needed
    return new Date(date).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

export default function StatsDisplay({ stats }: StatsDisplayProps) {
    return (
        <div className="mt-4 bg-white p-4 rounded-lg border border-gray-200 text-gray-800">
            <h4 className="text-lg font-medium mb-3">{stats.conversationTitle}</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 gap-x-12">
                {/* Left Column */}
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <span className="font-semibold">Participants:</span>
                        <span className="font-medium">{stats.participantCount}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-semibold">Messages:</span>
                        <span className="font-medium">{stats.messageCount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-semibold">Date Range:</span>
                        <span className="font-medium">
                            {formatDate(stats.firstMessageDate)} - {formatDate(stats.lastMessageDate)}
                        </span>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <span className="font-semibold">Photos:</span>
                        <span className="font-medium">{stats.mediaCount.photos.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-semibold">Videos:</span>
                        <span className="font-medium">{stats.mediaCount.videos.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-semibold">Audio:</span>
                        <span className="font-medium">{stats.mediaCount.audio.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-semibold">Reactions:</span>
                        <span className="font-medium">{stats.reactionCount.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Top Participants */}
            {stats.topSenders && stats.topSenders.length > 0 && (
                <div className="mt-4 w-1/2">
                    <h5 className="font-medium mb-2">Top Participants</h5>
                    <div className="space-y-1 mr-6">
                        {stats.topSenders.slice(0, 5).map((sender, index) => (
                            <div key={index} className="flex justify-between">
                                <span className="font-semibold">{sender.name}</span>
                                <span className="font-medium">{sender.count.toLocaleString()} messages</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
} 