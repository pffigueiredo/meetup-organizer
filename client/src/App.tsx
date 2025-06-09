
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import type { 
  RegisterUserInput, 
  LoginUserInput, 
  CreateMeetupInput, 
  AuthResponse, 
  MeetupWithRsvpCount,
  Meetup,
  CreateRsvpInput
} from '../../server/src/schema';

function App() {
  // Auth state
  const [user, setUser] = useState<AuthResponse['user'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Meetup data
  const [meetups, setMeetups] = useState<MeetupWithRsvpCount[]>([]);
  const [userRsvps, setUserRsvps] = useState<Meetup[]>([]);

  // Form states
  const [authForm, setAuthForm] = useState<'login' | 'register'>('login');
  const [loginData, setLoginData] = useState<LoginUserInput>({
    email: '',
    password: ''
  });
  const [registerData, setRegisterData] = useState<RegisterUserInput>({
    email: '',
    password: '',
    name: ''
  });
  const [meetupForm, setMeetupForm] = useState<CreateMeetupInput>({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    organizer_id: 0
  });

  // Load meetups
  const loadMeetups = useCallback(async () => {
    try {
      const result = await trpc.getUpcomingMeetups.query();
      setMeetups(result);
    } catch (error) {
      console.error('Failed to load meetups:', error);
    }
  }, []);

  // Load user RSVPs
  const loadUserRsvps = useCallback(async () => {
    if (!user) return;
    try {
      const result = await trpc.getUserRsvps.query(user.id);
      setUserRsvps(result);
    } catch (error) {
      console.error('Failed to load user RSVPs:', error);
    }
  }, [user]);

  // Load data on mount and when user changes
  useEffect(() => {
    loadMeetups();
  }, [loadMeetups]);

  useEffect(() => {
    loadUserRsvps();
  }, [loadUserRsvps]);

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.loginUser.mutate(loginData);
      setUser(response.user);
      setLoginData({ email: '', password: '' });
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.registerUser.mutate(registerData);
      setUser(response.user);
      setRegisterData({ email: '', password: '', name: '' });
    } catch (error) {
      console.error('Registration failed:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    setUser(null);
    setUserRsvps([]);
  };

  // Handle create meetup
  const handleCreateMeetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsLoading(true);
    try {
      const meetupData = {
        ...meetupForm,
        organizer_id: user.id
      };
      await trpc.createMeetup.mutate(meetupData);
      setMeetupForm({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        organizer_id: 0
      });
      await loadMeetups(); // Refresh meetups list
    } catch (error) {
      console.error('Failed to create meetup:', error);
      alert('Failed to create meetup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle RSVP
  const handleRsvp = async (meetupId: number) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const rsvpData: CreateRsvpInput = {
        user_id: user.id,
        meetup_id: meetupId
      };
      await trpc.createRsvp.mutate(rsvpData);
      await loadMeetups(); // Refresh to update RSVP counts
      await loadUserRsvps(); // Refresh user RSVPs
    } catch (error) {
      console.error('Failed to RSVP:', error);
      alert('Failed to RSVP. You may have already RSVP\'d to this meetup.');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user has RSVP'd to a meetup
  const hasRsvped = (meetupId: number) => {
    return userRsvps.some((rsvp: Meetup) => rsvp.id === meetupId);
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get today's date in YYYY-MM-DD format for date input min value
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-indigo-900">
              🤝 Meetup Manager
            </CardTitle>
            <p className="text-gray-600">Connect with your community</p>
          </CardHeader>
          <CardContent>
            <Tabs value={authForm} onValueChange={(value: string) => setAuthForm(value as 'login' | 'register')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <Input
                    type="email"
                    placeholder="Email"
                    value={loginData.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setLoginData((prev: LoginUserInput) => ({ ...prev, email: e.target.value }))
                    }
                    required
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={loginData.password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setLoginData((prev: LoginUserInput) => ({ ...prev, password: e.target.value }))
                    }
                    required
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Logging in...' : 'Login'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <Input
                    placeholder="Full Name"
                    value={registerData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setRegisterData((prev: RegisterUserInput) => ({ ...prev, name: e.target.value }))
                    }
                    required
                  />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={registerData.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setRegisterData((prev: RegisterUserInput) => ({ ...prev, email: e.target.value }))
                    }
                    required
                  />
                  <Input
                    type="password"
                    placeholder="Password (min 6 characters)"
                    value={registerData.password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setRegisterData((prev: RegisterUserInput) => ({ ...prev, password: e.target.value }))
                    }
                    minLength={6}
                    required
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🤝</span>
            <h1 className="text-xl font-bold text-indigo-900">Meetup Manager</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Welcome, {user.name}!</span>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="browse" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="browse">Browse Meetups</TabsTrigger>
            <TabsTrigger value="create">Create Meetup</TabsTrigger>
            <TabsTrigger value="my-rsvps">My RSVPs</TabsTrigger>
          </TabsList>

          {/* Browse Meetups Tab */}
          <TabsContent value="browse">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Upcoming Meetups</h2>
                <Badge variant="secondary" className="text-sm">
                  {meetups.length} meetup{meetups.length !== 1 ? 's' : ''} available
                </Badge>
              </div>
              
              {meetups.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <div className="text-6xl mb-4">📅</div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No Meetups Yet</h3>
                    <p className="text-gray-500">Be the first to create a meetup for your community!</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {meetups.map((meetup: MeetupWithRsvpCount) => (
                    <Card key={meetup.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{meetup.title}</CardTitle>
                          <Badge variant="outline">
                            {meetup.rsvp_count} RSVP{meetup.rsvp_count !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-gray-600 text-sm line-clamp-3">{meetup.description}</p>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center space-x-2">
                            <span>📅</span>
                            <span>{formatDate(meetup.date)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span>⏰</span>
                            <span>{meetup.time}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span>📍</span>
                            <span>{meetup.location}</span>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">
                            Created {meetup.created_at.toLocaleDateString()}
                          </span>
                          {hasRsvped(meetup.id) ? (
                            <Badge className="bg-green-100 text-green-800">
                              ✅ RSVP'd
                            </Badge>
                          ) : (
                            <Button 
                              size="sm" 
                              onClick={() => handleRsvp(meetup.id)}
                              disabled={isLoading}
                            >
                              RSVP
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Create Meetup Tab */}
          <TabsContent value="create">
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="text-2xl">Create New Meetup</CardTitle>
                <p className="text-gray-600">Bring your community together</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateMeetup} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title *
                    </label>
                    <Input
                      placeholder="e.g., Monthly JavaScript Developers Meetup"
                      value={meetupForm.title}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setMeetupForm((prev: CreateMeetupInput) => ({ ...prev, title: e.target.value }))
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <Textarea
                      placeholder="Describe what your meetup is about, what attendees can expect, and any requirements..."
                      value={meetupForm.description}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setMeetupForm((prev: CreateMeetupInput) => ({ ...prev, description: e.target.value }))
                      }
                      rows={4}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date *
                      </label>
                      <Input
                        type="date"
                        value={meetupForm.date}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setMeetupForm((prev: CreateMeetupInput) => ({ ...prev, date: e.target.value }))
                        }
                        min={getTodayDate()}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Time *
                      </label>
                      <Input
                        type="time"
                        value={meetupForm.time}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setMeetupForm((prev: CreateMeetupInput) => ({ ...prev, time: e.target.value }))
                        }
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location *
                    </label>
                    <Input
                      placeholder="e.g., Tech Hub Downtown, 123 Main St, or Online via Zoom"
                      value={meetupForm.location}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setMeetupForm((prev: CreateMeetupInput) => ({ ...prev, location: e.target.value }))
                      }
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creating Meetup...' : 'Create Meetup'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* My RSVPs Tab */}
          <TabsContent value="my-rsvps">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">My RSVPs</h2>
                <Badge variant="secondary" className="text-sm">
                  {userRsvps.length} meetup{userRsvps.length !== 1 ? 's' : ''} attending
                </Badge>
              </div>

              {userRsvps.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <div className="text-6xl mb-4">📋</div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No RSVPs Yet</h3>
                    <p className="text-gray-500">Browse meetups and RSVP to events you're interested in!</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {userRsvps.map((meetup: Meetup) => (
                    <Card key={meetup.id} className="border-l-4 border-l-green-500">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <span>✅</span>
                          <span>{meetup.title}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-gray-600 text-sm line-clamp-2">{meetup.description}</p>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center space-x-2">
                            <span>📅</span>
                            <span>{formatDate(meetup.date)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span>⏰</span>
                            <span>{meetup.time}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span>📍</span>
                            <span className="truncate">{meetup.location}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
