import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Subject, LearningSession } from '../lib/supabase';
import { Header } from '../components/Header';
import { Card, CardBody, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { BookOpen, TrendingDown, User } from 'lucide-react';

type SubjectWithStats = Subject & {
  sessionCount?: number;
  avgConfusion?: number;
  lastAttempt?: string;
};

export function Dashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [subjects, setSubjects] = useState<SubjectWithStats[]>([]);
  const [stats, setStats] = useState({
    totalAttempts: 0,
    avgConfusion: 0,
    completedSessions: 0,
  });
  const [recentSessions, setRecentSessions] = useState<LearningSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  async function loadDashboardData() {
    const { data: subjectsData } = await supabase
      .from('subjects')
      .select('*')
      .order('name');

    const { data: sessionsData } = await supabase
      .from('learning_sessions')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (subjectsData) {
      setSubjects(subjectsData);
    }

    if (sessionsData) {
      setRecentSessions(sessionsData);

      const totalAttempts = sessionsData.reduce((sum, s) => sum + s.attempts, 0);
      const avgConfusion = sessionsData.length > 0
        ? Math.round(sessionsData.reduce((sum, s) => sum + s.confusion_score, 0) / sessionsData.length)
        : 0;
      const completedSessions = sessionsData.filter(s => s.is_completed).length;

      setStats({
        totalAttempts,
        avgConfusion,
        completedSessions,
      });
    }

    setLoading(false);
  }

  function startLearning(subjectId: string) {
    navigate(`/learn/${subjectId}`);
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

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-1">
            Welcome back, {profile?.full_name || 'Learner'}
          </h2>
          <p className="text-slate-600">
            Continue your learning journey
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardBody className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Total Attempts</p>
                  <p className="text-3xl font-semibold text-slate-900">
                    {stats.totalAttempts}
                  </p>
                </div>
                <div className="p-3 bg-slate-100 rounded-lg">
                  <BookOpen className="w-5 h-5 text-slate-600" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Avg Confusion</p>
                  <p className="text-3xl font-semibold text-slate-900">
                    {stats.avgConfusion}%
                  </p>
                </div>
                <div className="p-3 bg-slate-100 rounded-lg">
                  <TrendingDown className="w-5 h-5 text-slate-600" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Learning Style</p>
                  <p className="text-lg font-medium text-slate-900">
                    {profile?.learning_fingerprint || 'New Learner'}
                  </p>
                </div>
                <div className="p-3 bg-slate-100 rounded-lg">
                  <User className="w-5 h-5 text-slate-600" />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Available Subjects
            </h3>
            <div className="space-y-3">
              {subjects.map((subject) => (
                <Card key={subject.id}>
                  <CardBody className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900 mb-1">
                          {subject.name}
                        </h4>
                        <p className="text-sm text-slate-600">
                          {subject.description || subject.title}
                        </p>
                      </div>
                      <Button
                        onClick={() => startLearning(subject.id)}
                        size="sm"
                      >
                        Start
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Recent Sessions
            </h3>
            {recentSessions.length === 0 ? (
              <Card>
                <CardBody className="p-8 text-center">
                  <p className="text-slate-500">No sessions yet. Start learning!</p>
                </CardBody>
              </Card>
            ) : (
              <div className="space-y-3">
                {recentSessions.map((session) => (
                  <Card key={session.id}>
                    <CardBody className="p-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${
                          session.is_completed ? 'text-green-600' : 'text-slate-600'
                        }`}>
                          {session.is_completed ? 'Completed' : 'In Progress'}
                        </span>
                        <span className="text-sm text-slate-500">
                          {new Date(session.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">
                          Attempts: {session.attempts}
                        </span>
                        <span className="text-slate-600">
                          Confusion: {session.confusion_score}%
                        </span>
                        <span className="text-slate-600">
                          Time: {Math.floor(session.time_spent / 60)}m {session.time_spent % 60}s
                        </span>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
