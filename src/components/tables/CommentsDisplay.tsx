
import { memo } from "react";

interface Comment {
  content: string;
  user_name: string;
}

interface CommentsDisplayProps {
  comments?: Comment[];
}

const CommentsDisplay = memo(({ comments }: CommentsDisplayProps) => {
  if (!comments || comments.length === 0) {
    return <div className="text-xs text-gray-400 italic">No comments</div>;
  }

  return (
    <div className="space-y-1">
      {comments.map((comment, index) => (
        <div key={index} className="text-xs p-2 rounded bg-gray-50 border-l-2 border-blue-200">
          <div className="font-medium text-blue-700 mb-1">{comment.user_name}</div>
          <div className="text-gray-600 break-words">{comment.content}</div>
        </div>
      ))}
    </div>
  );
});

CommentsDisplay.displayName = "CommentsDisplay";

export default CommentsDisplay;
