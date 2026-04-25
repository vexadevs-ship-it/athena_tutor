"use client";

import { useParams, useRouter } from "next/navigation";
import { useMyLearningTopic } from "@/hooks/use-my-learning-topic";
import { MicroLesson } from "@/components/learning/micro-lesson";

export default function MyLearningMicroLessonPage() {
  const params = useParams<{ topicId: string }>();
  const router = useRouter();
  const { data, isLoading } = useMyLearningTopic(params.topicId);

  if (isLoading) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center overflow-hidden">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  if (!data) return null;

  const { topic } = data;

  return (
    <div className="h-full min-h-0 overflow-hidden">
      <MicroLesson
        topic={topic.title}
        subtopic={topic.title}
        metadata={{
          description: topic.description,
          learningObjectives: topic.learningObjectives ?? [],
          tipsAndTricks: topic.tipsAndTricks ?? [],
          commonMistakes: topic.commonMistakes ?? [],
        }}
        streamUrl="/api/my-learning/lesson/stream"
        chatStreamUrl="/api/my-learning/lesson/chat/stream"
        practiceMode={{ subject: "math", quizStreamUrl: "/api/my-learning/quiz-chat/stream" }}
        onClose={() => router.push(`/my-learning/${params.topicId}`)}
      />
    </div>
  );
}
