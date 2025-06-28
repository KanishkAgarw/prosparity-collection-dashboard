
import { memo } from "react";
import type { BatchComment } from "@/hooks/useBatchComments";

interface Comment {
  content: string;
  user_name: string;
}

interface CommentsDisplayProps {
  comments?: Comment[] | BatchComment[];
  hasComments?: boolean;
}

const CommentsDisplay = memo(({ comments, hasComments }: CommentsDisplayProps) => {
  // If we have actual comments, show them
  if (comments && comments.length > 0) {
    return (
      <div className="space-y-1">
        {comments.slice(0, 2).map((comment, index) => (
          <div key={index} className="text-xs p-2 rounded bg-gray-50 border-l-2 border-blue-200">
            <div className="font-medium text-blue-700 mb-1">{comment.user_name}</div>
            <div className="text-gray-600 break-words line-clamp-2">{comment.content}</div>
          </div>
        ))}
        {comments.length > 2 && (
          <div className="text-xs text-blue-600 italic">
            +{comments.length - 2} more comments - click to view all
          </div>
        )}
      </div>
    );
  }

  // For empty state, show a simple indicator
  return (
    <div className="text-xs text-gray-400 italic">
      {hasComments ? 'Has comments - click to view' : 'Click to add comments'}
    </div>
  );
});

CommentsDisplay.displayName = "CommentsDisplay";

export default CommentsDisplay;
