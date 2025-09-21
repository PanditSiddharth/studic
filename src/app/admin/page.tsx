// src/app/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  BookOpen, Plus, Search, Filter, Eye, Edit, Trash2, 
  TrendingUp, Users, Download, DollarSign, 
  BarChart3, Calendar, Settings, Bell,
  Play, FileText, Link as LinkIcon, Image,
  ArrowUp, ArrowDown, MoreHorizontal,
  Upload
} from 'lucide-react';
import { Course, StudyMaterial } from '@/types';

export default function CreatorDashboard() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');

  // Mock analytics data
  const analytics = {
    totalViews: 12847,
    totalDownloads: 3426,
    totalLearners: 892,
    monthlyRevenue: 0, // Will show future revenue
    viewsChange: 23.4,
    downloadsChange: 12.8,
    learnersChange: 8.9
  };

  useEffect(() => {
    const loadData = async () => {
      // Simulate API calls
      setTimeout(() => {
        setCourses([
          {
            id: '1',
            title: 'Complete JavaScript Mastery',
            description: 'Learn JavaScript from basics to advanced concepts',
            isPublished: true,
            createdAt: new Date('2024-01-15'),
            updatedAt: new Date('2024-02-10'),
            materials: []
          },
          {
            id: '2',
            title: 'React Development Guide',
            description: 'Build modern web apps with React',
            isPublished: false,
            createdAt: new Date('2024-02-01'),
            updatedAt: new Date('2024-02-15'),
            materials: []
          },
          {
            id: '3',
            title: 'Python for Beginners',
            description: 'Start your programming journey with Python',
            isPublished: true,
            createdAt: new Date('2024-01-20'),
            updatedAt: new Date('2024-02-05'),
            materials: []
          }
        ]);

        setMaterials([
          {
            id: '1',
            title: 'JavaScript Fundamentals PDF',
            description: 'Comprehensive guide to JavaScript basics',
            type: 'pdf',
            fileUrl: '/materials/js-fundamentals.pdf',
            downloadUrl: '/api/download/js-fundamentals.pdf',
            isPublished: true,
            courseId: '1',
            createdAt: new Date('2024-01-16'),
            updatedAt: new Date('2024-01-16')
          },
          {
            id: '2',
            title: 'React Hooks Tutorial',
            description: 'Master React Hooks with examples',
            type: 'video',
            fileUrl: '/materials/react-hooks.mp4',
            isPublished: false,
            courseId: '2',
            createdAt: new Date('2024-02-02'),
            updatedAt: new Date('2024-02-02')
          },
          {
            id: '3',
            title: 'Python Cheat Sheet',
            description: 'Quick reference for Python syntax',
            type: 'image',
            fileUrl: '/materials/python-cheatsheet.png',
            downloadUrl: '/api/download/python-cheatsheet.png',
            isPublished: true,
            courseId: '3',
            createdAt: new Date('2024-01-21'),
            updatedAt: new Date('2024-01-21')
          }
        ]);

        setLoading(false);
      }, 1000);
    };

    loadData();
  }, []);

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'published' && course.isPublished) ||
      (filterStatus === 'draft' && !course.isPublished);
    return matchesSearch && matchesFilter;
  });

  const publishedCourses = courses.filter(c => c.isPublished).length;
  const publishedMaterials = materials.filter(m => m.isPublished).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="font-bold">StudIC</span>
            </Link>
            <Badge variant="secondary">Creator Dashboard</Badge>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
            <Button size="sm" asChild>
              <Link href="/publish">
                <Plus className="mr-2 h-4 w-4" />
                New Course
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, Creator! 👋</h1>
          <p className="text-muted-foreground">
            Here's an overview of your courses and performance
          </p>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalViews.toLocaleString()}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-green-500">+{analytics.viewsChange}%</span>
                <span className="ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Downloads</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalDownloads.toLocaleString()}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-green-500">+{analytics.downloadsChange}%</span>
                <span className="ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Learners</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalLearners.toLocaleString()}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-green-500">+{analytics.learnersChange}%</span>
                <span className="ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 mr-1" />
                <span>Coming Q2 2024</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="courses" className="space-y-6">
          <TabsList>
            <TabsTrigger value="courses">Courses ({courses.length})</TabsTrigger>
            <TabsTrigger value="materials">Materials ({materials.length})</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
          </TabsList>

          {/* Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                  <div>
                    <CardTitle>Your Courses</CardTitle>
                    <CardDescription>Manage and monitor your published courses</CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search courses..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                      <SelectTrigger className="w-[180px]">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Courses</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="draft">Drafts</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredCourses.map((course) => (
                    <div key={course.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold truncate">{course.title}</h3>
                            <Badge variant={course.isPublished ? 'default' : 'secondary'}>
                              {course.isPublished ? 'Published' : 'Draft'}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                            {course.description}
                          </p>
                          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                            <span>Created: {course.createdAt.toLocaleDateString()}</span>
                            <span>Updated: {course.updatedAt.toLocaleDateString()}</span>
                            <span>Materials: {materials.filter(m => m.courseId === course.id).length}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/courses/${course.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {filteredCourses.length === 0 && (
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No courses found</h3>
                      <p className="text-muted-foreground mb-4">
                        {searchTerm ? 'Try adjusting your search terms' : 'Start by creating your first course'}
                      </p>
                      <Button asChild>
                        <Link href="/publish">
                          <Plus className="mr-2 h-4 w-4" />
                          Create Course
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Materials Tab */}
          <TabsContent value="materials" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Materials</CardTitle>
                <CardDescription>All your uploaded content and resources</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {materials.map((material) => {
                    const course = courses.find(c => c.id === material.courseId);
                    return (
                      <div key={material.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4 flex-1">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                              material.type === 'pdf' ? 'bg-red-100 text-red-600' :
                              material.type === 'video' ? 'bg-blue-100 text-blue-600' :
                              material.type === 'image' ? 'bg-yellow-100 text-yellow-600' :
                              'bg-green-100 text-green-600'
                            }`}>
                              {material.type === 'pdf' ? <FileText className="h-6 w-6" /> :
                               material.type === 'video' ? <Play className="h-6 w-6" /> :
                               material.type === 'link' ? <LinkIcon className="h-6 w-6" /> :
                               <Image className="h-6 w-6" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="font-semibold truncate">{material.title}</h3>
                                <Badge variant={material.isPublished ? 'default' : 'secondary'}>
                                  {material.isPublished ? 'Published' : 'Draft'}
                                </Badge>
                                <Badge variant="outline" className="capitalize">
                                  {material.type}
                                </Badge>
                              </div>
                              <p className="text-muted-foreground text-sm mb-2">
                                {material.description}
                              </p>
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                <span>Course: {course?.title || 'Unassigned'}</span>
                                <span>Created: {material.createdAt.toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {material.fileUrl && (
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={material.fileUrl} target="_blank">
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                            )}
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Overview</CardTitle>
                  <CardDescription>Course views and engagement metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Total Course Views</span>
                      <span className="text-2xl font-bold">{analytics.totalViews.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Material Downloads</span>
                      <span className="text-2xl font-bold">{analytics.totalDownloads.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Active Learners</span>
                      <span className="text-2xl font-bold">{analytics.totalLearners.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Courses</CardTitle>
                  <CardDescription>Your most popular content</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {courses.filter(c => c.isPublished).map((course, index) => (
                      <div key={course.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">{course.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {Math.floor(Math.random() * 1000 + 500)} views
                            </p>
                          </div>
                        </div>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Growth</CardTitle>
                <CardDescription>Track your progress over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Analytics charts coming soon</p>
                    <p className="text-sm">We're building detailed analytics to help you grow</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Dashboard</CardTitle>
                <CardDescription>Monetization coming Q2 2024</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <DollarSign className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
                  <h3 className="text-2xl font-bold mb-4">Revenue Features Coming Soon!</h3>
                  <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                    We're working on exciting monetization features to help creators like you earn from your content. 
                    Stay tuned for updates on ad revenue sharing, premium courses, and creator fund programs.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                    <Card className="border-dashed">
                      <CardHeader className="text-center">
                        <div className="w-12 h-12 mx-auto bg-green-100 rounded-lg flex items-center justify-center mb-3">
                          <TrendingUp className="h-6 w-6 text-green-600" />
                        </div>
                        <CardTitle className="text-lg">Ad Revenue Sharing</CardTitle>
                      </CardHeader>
                      <CardContent className="text-center">
                        <p className="text-sm text-muted-foreground">
                          Earn from ads displayed alongside your courses
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-dashed">
                      <CardHeader className="text-center">
                        <div className="w-12 h-12 mx-auto bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                          <BookOpen className="h-6 w-6 text-blue-600" />
                        </div>
                        <CardTitle className="text-lg">Premium Courses</CardTitle>
                      </CardHeader>
                      <CardContent className="text-center">
                        <p className="text-sm text-muted-foreground">
                          Offer paid premium content with advanced features
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-dashed">
                      <CardHeader className="text-center">
                        <div className="w-12 h-12 mx-auto bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                          <Users className="h-6 w-6 text-purple-600" />
                        </div>
                        <CardTitle className="text-lg">Creator Fund</CardTitle>
                      </CardHeader>
                      <CardContent className="text-center">
                        <p className="text-sm text-muted-foreground">
                          Monthly bonuses for top-performing creators
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="mt-8">
                    <Button size="lg" className="mr-4">
                      Get Early Access
                    </Button>
                    <Button variant="outline" size="lg">
                      Learn More
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button className="h-20 flex-col space-y-2" variant="outline" asChild>
                <Link href="/publish">
                  <Plus className="h-6 w-6" />
                  <span>Create Course</span>
                </Link>
              </Button>
              
              <Button className="h-20 flex-col space-y-2" variant="outline">
                <Upload className="h-6 w-6" />
                <span>Upload Material</span>
              </Button>
              
              <Button className="h-20 flex-col space-y-2" variant="outline">
                <BarChart3 className="h-6 w-6" />
                <span>View Analytics</span>
              </Button>
              
              <Button className="h-20 flex-col space-y-2" variant="outline">
                <Settings className="h-6 w-6" />
                <span>Account Settings</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}