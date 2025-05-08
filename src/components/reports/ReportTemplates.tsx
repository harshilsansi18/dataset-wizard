
import React, { useState, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import { 
  getValidationTemplates, 
  createValidationTemplate, 
  updateValidationTemplate,
  deleteValidationTemplate,
  ValidationTemplate,
  ValidationMethods
} from "@/services/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

type ReportTemplatesProps = {
  onRefresh: () => void;
};

// Form schema
const templateFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string(),
  validationMethods: z.array(z.string()).min(1, "Select at least one validation method")
});

const ReportTemplates = ({ onRefresh }: ReportTemplatesProps) => {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ValidationTemplate | null>(null);
  
  // Query for templates
  const { 
    data: templates = [], 
    isLoading,
    refetch 
  } = useQuery({
    queryKey: ['validationTemplates'],
    queryFn: getValidationTemplates
  });
  
  // Form setup
  const form = useForm<z.infer<typeof templateFormSchema>>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: "",
      description: "",
      validationMethods: []
    }
  });
  
  // When editing template changes, update form
  useEffect(() => {
    if (editingTemplate) {
      form.reset({
        name: editingTemplate.name,
        description: editingTemplate.description,
        validationMethods: editingTemplate.validationMethods
      });
      setIsCreateDialogOpen(true);
    }
  }, [editingTemplate, form]);
  
  // Handle form submission
  const onSubmit = async (data: z.infer<typeof templateFormSchema>) => {
    try {
      if (editingTemplate) {
        // Update existing template
        await updateValidationTemplate(editingTemplate.id, data);
      } else {
        // Create new template
        await createValidationTemplate(data);
      }
      
      // Reset and close
      form.reset();
      setIsCreateDialogOpen(false);
      setEditingTemplate(null);
      refetch();
      onRefresh();
      
      toast({
        title: editingTemplate ? "Template Updated" : "Template Created",
        description: `Validation template was ${editingTemplate ? "updated" : "created"} successfully.`
      });
    } catch (error) {
      console.error("Error saving template:", error);
      toast({
        title: "Error",
        description: `Failed to ${editingTemplate ? "update" : "create"} template.`,
        variant: "destructive"
      });
    }
  };
  
  // Handle template deletion
  const handleDelete = async (template: ValidationTemplate) => {
    try {
      await deleteValidationTemplate(template.id);
      refetch();
      onRefresh();
      
      toast({
        title: "Template Deleted",
        description: `Template "${template.name}" was deleted successfully.`
      });
    } catch (error) {
      console.error("Error deleting template:", error);
      toast({
        title: "Error",
        description: "Failed to delete template.",
        variant: "destructive"
      });
    }
  };
  
  // Available validation methods
  const validationMethodOptions = [
    { value: ValidationMethods.BASIC, label: "Basic Checks" },
    { value: ValidationMethods.ADVANCED, label: "Advanced Checks" },
    { value: ValidationMethods.FORMAT_CHECKS, label: "Format Checks" },
    { value: ValidationMethods.VALUE_LOOKUP, label: "Value Lookup" },
    { value: ValidationMethods.DATA_COMPLETENESS, label: "Data Completeness" },
    { value: ValidationMethods.DATA_QUALITY, label: "Data Quality" },
    { value: ValidationMethods.STATISTICAL_ANALYSIS, label: "Statistical Analysis" },
    { value: ValidationMethods.TEXT_ANALYSIS, label: "Text Analysis" },
    { value: ValidationMethods.CROSS_COLUMN, label: "Cross Column" },
    { value: ValidationMethods.REGEX_PATTERN, label: "Regex Pattern" },
    { value: ValidationMethods.SCHEMA_VALIDATION, label: "Schema Validation" }
  ];
  
  // Reset form when closing dialog
  const handleDialogOpenChange = (open: boolean) => {
    setIsCreateDialogOpen(open);
    if (!open) {
      form.reset();
      setEditingTemplate(null);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Validation Templates</h2>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? "Edit Template" : "Create Validation Template"}
              </DialogTitle>
              <DialogDescription>
                Define a reusable template for data validation
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Name</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g., Basic Data Quality" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe what this template validates" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="validationMethods"
                  render={() => (
                    <FormItem>
                      <div className="mb-2">
                        <FormLabel>Validation Methods</FormLabel>
                        <FormDescription>
                          Select the validation methods to include
                        </FormDescription>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {validationMethodOptions.map((option) => (
                          <FormField
                            key={option.value}
                            control={form.control}
                            name="validationMethods"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={option.value}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(option.value)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, option.value])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== option.value
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">
                                    {option.label}
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="submit">
                    {editingTemplate ? "Save Changes" : "Create Template"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading templates...</div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="mb-4 text-muted-foreground">No validation templates created yet</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <CardDescription>
                  {template.validationMethods.length} validation methods
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {template.description || "No description provided"}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {template.validationMethods.map((method) => (
                    <span 
                      key={method}
                      className="text-xs rounded-full bg-slate-100 px-2 py-1"
                    >
                      {method}
                    </span>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleDelete(template)}
                >
                  <Trash className="h-4 w-4 mr-1" />
                  Delete
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setEditingTemplate(template)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportTemplates;
