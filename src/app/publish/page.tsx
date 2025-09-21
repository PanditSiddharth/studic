// src/app/publish/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, BookOpen, Upload, Video, FileText, Link as LinkIcon, Image, Plus, Trash2, Eye, Save } from 'lucide-react';

export default function PublishCoursePage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    category: '',
    level: '',
    language: 'English',
    thumbnail: '',
    tags: [] as string[],
    isPublished: false
  });

  const [materials, setMaterials] = useState([
    {
      id: 1,
      title: '',
      description: '',
      type: 'pdf' as 'pdf' | 'video' | 'document' | 'link' | 'image',
      file: null as File | null,
      url: '',
      isPublished: true
    }
  ]);

  const steps = [
    { title: 'Course Info', description: 'Basic course details' },
    { title: 'Add Materials', description: 'Upload your content' },
    { title: 'Settings', description: 'Publishing options' },
    { title: 'Preview', description: 'Review & publish' }
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const addMaterial = () => {
    setMaterials([...materials, {
      id: materials.length + 1,
      title: '',
      description: '',
      type: 'pdf',
      file: null,
      url: '',
      isPublished: true
    }]);
  };

  const removeMaterial = (id: number) => {
    setMaterials(materials.filter(m => m.id !== id));
  };

  const updateMaterial = (id: number, field: string, value: any) => {
    setMaterials(materials.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const handleFileUpload = (id: number, file: File) => {
    updateMaterial(id, 'file', file);
    if (!materials.find(m => m.id === id)?.title) {
      updateMaterial(id, 'title', file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="font-bold">StudIC</span>
            </Link>
            <span className="text-muted-foreground">/ Publish Course</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/">Cancel</Link>
            </Button>
            <Button variant="outline">
              <Save className="mr-2 h-4 w-4" />
              Save Draft
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-8">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">Create Your Course</h1>
            <Badge variant="secondary">{Math.round(progress)}% Complete</Badge>
          </div>
          <Progress value={progress} className="mb-4" />
          <div className="flex justify-between text-sm">
            {steps.map((step, index) => (
              <div key={index} className={`flex flex-col items-center ${
                index <= currentStep ? 'text-primary' : 'text-muted-foreground'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium mb-2 ${
                  index <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  {index + 1}
                </div>
                <span className="font-medium">{step.title}</span>
                <span className="text-xs text-muted-foreground">{step.description}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>{steps[currentStep].title}</CardTitle>
                <CardDescription>{steps[currentStep].description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Step 0: Course Info */}
                {currentStep === 0 && (
                  <div className="space-y-6">
                    {/* ... Course Info code from your snippet ... */}
                  </div>
                )}

                {/* Step 1: Add Materials */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    {/* ... Add Materials code from your snippet ... */}
                  </div>
                )}

                {/* Step 2: Settings */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Publishing Options</h3>
                      <Switch
                        checked={courseData.isPublished}
                        onCheckedChange={(checked) => setCourseData({...courseData, isPublished: checked})}
                      />
                    </div>
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {courseData.isPublished
                          ? 'Your course will be publicly visible to all learners.'
                          : 'Your course will remain as a draft and hidden from learners.'}
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {/* Step 3: Preview */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    {/* ... Preview code from your snippet ... */}
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                    disabled={currentStep === 0}
                  >
                    Previous
                  </Button>
                  
                  {currentStep < steps.length - 1 ? (
                    <Button
                      onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                      disabled={
                        (currentStep === 0 && (!courseData.title || !courseData.description)) ||
                        (currentStep === 1 && materials.filter(m => m.title && (m.file || m.url)).length === 0)
                      }
                    >
                      Next Step
                    </Button>
                  ) : (
                    <Button className="bg-primary">
                      <Upload className="mr-2 h-4 w-4" />
                      {courseData.isPublished ? 'Publish Course' : 'Save as Draft'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* ... Sidebar code from your snippet ... */}
          </div>
        </div>
      </div>
    </div>
  );
}
