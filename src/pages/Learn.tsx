import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Subject, LearningSession } from '../lib/supabase';
import { Header } from '../components/Header';
import { Card, CardBody, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Clock, Target, Brain, CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react';

const CONFUSION_THRESHOLD = 40;

export function Learn() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [subject, setSubject] = useState<Subject | null>(null);
  const [session, setSession] = useState<LearningSession | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [confusionScore, setConfusionScore] = useState(0);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [showAIHelp, setShowAIHelp] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (subjectId && user) {
      loadSubjectAndCreateSession();
    }
  }, [subjectId, user]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  async function loadSubjectAndCreateSession() {
    const { data: subjectData } = await supabase
      .from('subjects')
      .select('*')
      .eq('id', subjectId)
      .maybeSingle();

    if (subjectData) {
      setSubject(subjectData);

      const { data: sessionData } = await supabase
        .from('learning_sessions')
        .insert({
          user_id: user!.id,
          subject_id: subjectData.id,
          start_time: new Date().toISOString(),
        })
        .select()
        .single();

      if (sessionData) {
        setSession(sessionData);
      }
    }

    setLoading(false);
  }

  async function submitAnswer(e: React.FormEvent) {
    e.preventDefault();

    if (!subject || !session || !userAnswer.trim()) return;

    const newAttempts = attempts + 1;
    const currentTime = Math.floor((Date.now() - startTime) / 1000);

    const newConfusionScore = Math.min(100, newAttempts * 20 + Math.min(currentTime, 60));

    setAttempts(newAttempts);
    setTimeSpent(currentTime);
    setConfusionScore(newConfusionScore);

    const isCorrect = userAnswer.toLowerCase().trim().includes(
      subject.correct_answer.toLowerCase()
    );

    await supabase.from('session_attempts').insert({
      session_id: session.id,
      attempt_number: newAttempts,
      user_answer: userAnswer,
      is_correct: isCorrect,
      time_from_start: currentTime,
    });

    await supabase
      .from('learning_sessions')
      .update({
        attempts: newAttempts,
        time_spent: currentTime,
        confusion_score: newConfusionScore,
        is_completed: isCorrect,
        ai_help_shown: newConfusionScore >= CONFUSION_THRESHOLD || showAIHelp,
        end_time: isCorrect ? new Date().toISOString() : null,
      })
      .eq('id', session.id);

    if (isCorrect) {
      setFeedback({
        type: 'success',
        message: 'Correct! Well done.',
      });
    } else {
      setFeedback({
        type: 'error',
        message: 'Not quite right. Try again.',
      });

      if (newConfusionScore >= CONFUSION_THRESHOLD) {
        setShowAIHelp(true);
      }
    }
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <p className="text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <p className="text-slate-500">Subject not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-slate-600 hover:text-slate-900 mb-2"
          >
            ← Back to Dashboard
          </button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <h1 className="text-2xl font-semibold text-slate-900">
              {subject.title}
            </h1>
          </CardHeader>

          <CardBody className="space-y-6">
            <div>
              <h2 className="text-base font-medium text-slate-900 mb-3">
                Question
              </h2>
              <p className="text-slate-700 leading-relaxed">
                {subject.question}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="text-sm font-medium text-slate-700 mb-2">Data</p>
              <p className="text-slate-900 font-mono text-sm">
                {subject.data}
              </p>
            </div>

            <div className="flex items-center gap-6 text-sm text-slate-600 border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{formatTime(timeSpent)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                <span>Attempts: {attempts}</span>
              </div>
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                <span>Confusion: {confusionScore}%</span>
              </div>
            </div>

            <form onSubmit={submitAnswer} className="space-y-4">
              <Input
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Enter your answer"
                disabled={feedback.type === 'success'}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={feedback.type === 'success' || !userAnswer.trim()}
              >
                Submit Answer
              </Button>
            </form>

            {feedback.type && (
              <div
                className={`flex items-start gap-3 p-4 rounded-lg border ${
                  feedback.type === 'success'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <p
                  className={`text-sm font-medium ${
                    feedback.type === 'success' ? 'text-green-900' : 'text-red-900'
                  }`}
                >
                  {feedback.message}
                </p>
              </div>
            )}
          </CardBody>
        </Card>

        {showAIHelp && feedback.type !== 'success' && (
          <Card className="border-l-4 border-l-blue-400">
            <CardBody className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 mb-1">
                    Learning Assistance
                  </h3>
                  <p className="text-sm text-slate-600">
                    It looks like you might be stuck. Here's some guidance:
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
                <p className="text-sm text-slate-700 leading-relaxed">
                  {subject.ai_help_text}
                </p>
              </div>

              <a
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                  subject.video_search_query
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Watch video explanation
                <ExternalLink className="w-4 h-4" />
              </a>
            </CardBody>
          </Card>
        )}

        {feedback.type === 'success' && (
          <div className="text-center">
            <Button onClick={() => navigate('/dashboard')}>
              Return to Dashboard
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
