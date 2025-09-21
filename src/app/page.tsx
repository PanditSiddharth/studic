// src/app/page.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Download, Users, TrendingUp, Play, FileText, ExternalLink } from 'lucide-react';
import { db } from '@/lib/database';

export default async function HomePage() {
  const courses = await db.courses.findPublished();
  const recentMaterials = await db.materials.findPublished();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <div className="mr-8 flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">StudIC</span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link href="/courses" className="text-foreground/60 hover:text-foreground">
                Courses
              </Link>
              <Link href="/materials" className="text-foreground/60 hover:text-foreground">
                Materials
              </Link>
              <Link href="/content" className="text-foreground/60 hover:text-foreground">
                Content
              </Link>
            </nav>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/publish">Publish Course</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/admin">Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-24 md:py-32">
        <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
          <Badge variant="secondary" className="px-4 py-1">
            🚀 Free Course Publishing Platform
          </Badge>
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
            Share Knowledge,
            <span className="text-primary"> Build Community</span>
          </h1>
          <p className="max-w-[700px] text-lg text-muted-foreground sm:text-xl">
            Create and publish your courses, share study materials, and build a learning community. 
            Everything is free for creators and learners.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/publish">
                <BookOpen className="mr-2 h-5 w-5" />
                Start Publishing
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/courses">
                <Play className="mr-2 h-5 w-5" />
                Explore Courses
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-muted/50">
        <div className="container py-16">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{courses.length}+</div>
              <p className="text-sm text-muted-foreground">Published Courses</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{recentMaterials.length}+</div>
              <p className="text-sm text-muted-foreground">Study Materials</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">100%</div>
              <p className="text-sm text-muted-foreground">Free Access</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">24/7</div>
              <p className="text-sm text-muted-foreground">Available</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="container py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Featured Courses</h2>
            <p className="text-muted-foreground mt-2">
              Discover popular courses from our community
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/courses">View All</Link>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.slice(0, 6).map((course) => (
            <Card key={course.id} className="group hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 rounded-t-lg" />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">Free</Badge>
                  <span className="text-sm text-muted-foreground">
                    {course.materials.length} materials
                  </span>
                </div>
                <CardTitle className="group-hover:text-primary transition-colors">
                  {course.title}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {course.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Updated {course.updatedAt.toLocaleDateString()}
                  </span>
                  <Button size="sm" variant="ghost" asChild>
                    <Link href={`/courses/${course.id}`}>
                      View Course
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Recent Materials */}
      <section className="bg-muted/50">
        <div className="container py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Latest Materials</h2>
              <p className="text-muted-foreground mt-2">
                Fresh content added by our community
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/materials">Browse All</Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentMaterials.slice(0, 6).map((material) => (
              <Card key={material.id} className="group hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      material.type === 'pdf' ? 'bg-red-100 text-red-600' :
                      material.type === 'video' ? 'bg-blue-100 text-blue-600' :
                      'bg-green-100 text-green-600'
                    }`}>
                      {material.type === 'pdf' ? <FileText className="h-5 w-5" /> :
                       material.type === 'video' ? <Play className="h-5 w-5" /> :
                       <BookOpen className="h-5 w-5" />}
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {material.type}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {material.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {material.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {material.createdAt.toLocaleDateString()}
                    </span>
                    {material.downloadUrl && (
                      <Button size="sm" variant="ghost" asChild>
                        <a href={material.downloadUrl} download>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-16">
        <div className="bg-primary rounded-2xl p-8 md:p-16 text-center text-primary-foreground">
          <h2 className="text-3xl font-bold mb-4">Ready to Share Your Knowledge?</h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Join thousands of educators and creators who are building the future of learning. 
            Start publishing your courses today - it's completely free!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary">
              <Users className="mr-2 h-5 w-5" />
              Join Community
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
              <TrendingUp className="mr-2 h-5 w-5" />
              View Analytics
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <BookOpen className="h-6 w-6 text-primary" />
                <span className="font-bold text-xl">StudIC</span>
              </div>
              <p className="text-muted-foreground text-sm">
                Empowering educators and learners with free, accessible course publishing platform.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/courses" className="text-muted-foreground hover:text-foreground">Browse Courses</Link></li>
                <li><Link href="/materials" className="text-muted-foreground hover:text-foreground">Study Materials</Link></li>
                <li><Link href="/publish" className="text-muted-foreground hover:text-foreground">Publish Course</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Community</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/creators" className="text-muted-foreground hover:text-foreground">For Creators</Link></li>
                <li><Link href="/learners" className="text-muted-foreground hover:text-foreground">For Learners</Link></li>
                <li><Link href="/success" className="text-muted-foreground hover:text-foreground">Success Stories</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/help" className="text-muted-foreground hover:text-foreground">Help Center</Link></li>
                <li><Link href="/contact" className="text-muted-foreground hover:text-foreground">Contact</Link></li>
                <li><Link href="/about" className="text-muted-foreground hover:text-foreground">About</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 StudIC. Building the future of online education.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}