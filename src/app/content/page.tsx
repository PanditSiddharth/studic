// src/app/content/page.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { BookOpen, Search, Calendar, User, ArrowRight, TrendingUp, Clock, Eye } from 'lucide-react';

// Mock content data
const contentPages = [
  {
    id: '1',
    title: 'Getting Started with Web Development',
    description: 'A comprehensive guide to begin your web development journey with HTML, CSS, and JavaScript basics.',
    author: 'John Smith',
    publishedAt: new Date('2024-02-15'),
    category: 'Web Development',
    readTime: '8 min read',
    views: 1247,
    featured: true,
    tags: ['HTML', 'CSS', 'JavaScript', 'Beginner']
  },
  {
    id: '2',
    title: 'Python Data Science Essentials',
    description: 'Learn the fundamental libraries and concepts for data science with Python including pandas, numpy, and matplotlib.',
    author: 'Sarah Johnson',
    publishedAt: new Date('2024-02-10'),
    category: 'Data Science',
    readTime: '12 min read',
    views: 892,
    featured: true,
    tags: ['Python', 'Data Science', 'Pandas', 'NumPy']
  },
  {
    id: '3',
    title: 'Mobile App Design Best Practices',
    description: 'Essential design principles and UI/UX guidelines for creating engaging mobile applications.',
    author: 'Mike Chen',
    publishedAt: new Date('2024-02-08'),
    category: 'Design',
    readTime: '6 min read',
    views: 634,
    featured: false,
    tags: ['UI/UX', 'Mobile', 'Design', 'Best Practices']
  },
  {
    id: '4',
    title: 'Machine Learning for Beginners',
    description: 'Introduction to machine learning concepts, algorithms, and practical applications for newcomers.',
    author: 'Dr. Emily Davis',
    publishedAt: new Date('2024-02-05'),
    category: 'AI/ML',
    readTime: '15 min read',
    views: 1456,
    featured: false,
    tags: ['Machine Learning', 'AI', 'Algorithms', 'Beginner']
  },
  {
    id: '5',
    title: 'React Performance Optimization',
    description: 'Advanced techniques to optimize React applications for better performance and user experience.',
    author: 'Alex Turner',
    publishedAt: new Date('2024-02-03'),
    category: 'Web Development',
    readTime: '10 min read',
    views: 721,
    featured: false,
    tags: ['React', 'Performance', 'Optimization', 'Advanced']
  },
  {
    id: '6',
    title: 'Digital Marketing Strategy Guide',
    description: 'Complete guide to building effective digital marketing campaigns and measuring their success.',
    author: 'Lisa Rodriguez',
    publishedAt: new Date('2024-02-01'),
    category: 'Marketing',
    readTime: '9 min read',
    views: 543,
    featured: false,
    tags: ['Digital Marketing', 'Strategy', 'SEO', 'Social Media']
  }
];

const categories = [
  'All Categories',
  'Web Development',
  'Data Science',
  'AI/ML',
  'Design',
  'Marketing',
  'Business'
];

export default function ContentPage() {
  const featuredContent = contentPages.filter(content => content.featured);
  const recentContent = contentPages.slice().sort((a, b) => 
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
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
              <Link href="/content" className="text-foreground hover:text-foreground">
                Content
              </Link>
            </nav>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/content/create">Write Article</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/admin">Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b bg-muted/30">
        <div className="container py-16">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Learn from Expert Content
            </h1>
            <p className="text-xl text-muted-foreground">
              Discover in-depth articles, tutorials, and guides created by industry experts
              and passionate educators from around the world.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  className="pl-10 pr-4 py-3 text-base"
                  placeholder="Search articles, tutorials, guides..."
                />
                <Button size="sm" className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  Search
                </Button>
              </div>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap justify-center gap-2 pt-4">
              {categories.map((category, index) => (
                <Button 
                  key={category}
                  variant={index === 0 ? "default" : "outline"} 
                  size="sm"
                  className="rounded-full"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="container py-8">
        {/* Featured Content */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Featured Articles</h2>
              <p className="text-muted-foreground">Hand-picked content from our community</p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/content/featured">
                View All Featured
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {featuredContent.map((content, index) => (
              <Card key={content.id} className={`group hover:shadow-lg transition-all ${
                index === 0 ? 'lg:row-span-2' : ''
              }`}>
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 rounded-t-lg" />
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary">{content.category}</Badge>
                    <Badge variant="outline">Featured</Badge>
                  </div>
                  <CardTitle className="group-hover:text-primary transition-colors line-clamp-2">
                    {content.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-3">
                    {content.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>{content.author}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{content.readTime}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Eye className="h-3 w-3" />
                      <span>{content.views}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-4">
                    {content.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <Button variant="ghost" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors" asChild>
                    <Link href={`/content/${content.id}`}>
                      Read Article
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Recent Content */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Latest Articles</h2>
              <p className="text-muted-foreground">Fresh content from our creators</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <TrendingUp className="mr-2 h-4 w-4" />
                Trending
              </Button>
              <Button variant="outline" size="sm">
                <Calendar className="mr-2 h-4 w-4" />
                Recent
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentContent.slice(0, 6).map(content => (
              <Card key={content.id} className="group hover:shadow-md transition-shadow">
                <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 rounded-t-lg" />
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary">{content.category}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {content.publishedAt.toLocaleDateString()}
                    </span>
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                    {content.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {content.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                    <span>{content.author}</span>
                    <div className="flex items-center space-x-3">
                      <span>{content.readTime}</span>
                      <div className="flex items-center space-x-1">
                        <Eye className="h-3 w-3" />
                        <span>{content.views}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-4">
                    {content.tags.slice(0, 2).map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <Button variant="ghost" size="sm" className="w-full" asChild>
                    <Link href={`/content/${content.id}`}>
                      Read More
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button variant="outline" size="lg">
              Load More Articles
            </Button>
          </div>
        </section>

        {/* Newsletter Signup */}
        <section className="bg-muted rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Stay Updated</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Get the latest articles, tutorials, and learning resources delivered to your inbox.
            Join thousands of learners staying ahead in their field.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Input placeholder="Enter your email" className="flex-1" />
            <Button>Subscribe</Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            No spam, unsubscribe anytime. We respect your privacy.
          </p>
        </section>
      </div>
    </div>
  );
}