import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { X, Calculator, TrendingUp } from 'lucide-react';
import { apiService } from '@/services/api';
import { toast } from 'sonner';

interface CreateEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  vulnId: number;
}

interface CVSSMetrics {
  [key: string]: string | undefined;
  AV?: string;
  AC?: string;
  PR?: string;
  UI?: string;
  S?: string;
  C?: string;
  I?: string;
  A?: string;
  E?: string;
  RL?: string;
  RC?: string;
  CR?: string;
  IR?: string;
  AR?: string;
  MAV?: string;
  MAC?: string;
  MPR?: string;
  MUI?: string;
  MS?: string;
  MC?: string;
  MI?: string;
  MA?: string;
}

export const CreateEvaluationModal: React.FC<CreateEvaluationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  vulnId
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vector, setVector] = useState('');
  const [metrics, setMetrics] = useState<CVSSMetrics>({});
  const [scores, setScores] = useState<any>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Calculate scores when modal opens or vector changes
  useEffect(() => {
    if (vector && isOpen) {
      calculateScores();
    }
  }, [vector, isOpen]);

  const baseMetrics = [
    { key: 'AV', label: 'Attack Vector', options: [
      { value: 'N', label: 'Network (N)' },
      { value: 'A', label: 'Adjacent (A)' },
      { value: 'L', label: 'Local (L)' },
      { value: 'P', label: 'Physical (P)' }
    ]},
    { key: 'AC', label: 'Attack Complexity', options: [
      { value: 'L', label: 'Low (L)' },
      { value: 'H', label: 'High (H)' }
    ]},
    { key: 'PR', label: 'Privileges Required', options: [
      { value: 'N', label: 'None (N)' },
      { value: 'L', label: 'Low (L)' },
      { value: 'H', label: 'High (H)' }
    ]},
    { key: 'UI', label: 'User Interaction', options: [
      { value: 'N', label: 'None (N)' },
      { value: 'R', label: 'Required (R)' }
    ]},
    { key: 'S', label: 'Scope', options: [
      { value: 'U', label: 'Unchanged (U)' },
      { value: 'C', label: 'Changed (C)' }
    ]},
    { key: 'C', label: 'Confidentiality Impact', options: [
      { value: 'N', label: 'None (N)' },
      { value: 'L', label: 'Low (L)' },
      { value: 'H', label: 'High (H)' }
    ]},
    { key: 'I', label: 'Integrity Impact', options: [
      { value: 'N', label: 'None (N)' },
      { value: 'L', label: 'Low (L)' },
      { value: 'H', label: 'High (H)' }
    ]},
    { key: 'A', label: 'Availability Impact', options: [
      { value: 'N', label: 'None (N)' },
      { value: 'L', label: 'Low (L)' },
      { value: 'H', label: 'High (H)' }
    ]}
  ];

  const temporalMetrics = [
    { key: 'E', label: 'Exploitability', options: [
      { value: 'X', label: 'Not Defined (X)' },
      { value: 'U', label: 'Unproven (U)' },
      { value: 'P', label: 'Proof-of-Concept (P)' },
      { value: 'F', label: 'Functional (F)' },
      { value: 'H', label: 'High (H)' }
    ]},
    { key: 'RL', label: 'Remediation Level', options: [
      { value: 'X', label: 'Not Defined (X)' },
      { value: 'O', label: 'Official Fix (O)' },
      { value: 'T', label: 'Temporary Fix (T)' },
      { value: 'W', label: 'Workaround (W)' },
      { value: 'U', label: 'Unavailable (U)' }
    ]},
    { key: 'RC', label: 'Report Confidence', options: [
      { value: 'X', label: 'Not Defined (X)' },
      { value: 'U', label: 'Unknown (U)' },
      { value: 'R', label: 'Reasonable (R)' },
      { value: 'C', label: 'Confirmed (C)' }
    ]}
  ];

  const environmentalMetrics = [
    { key: 'CR', label: 'Confidentiality Requirement', options: [
      { value: 'X', label: 'Not Defined (X)' },
      { value: 'L', label: 'Low (L)' },
      { value: 'M', label: 'Medium (M)' },
      { value: 'H', label: 'High (H)' }
    ]},
    { key: 'IR', label: 'Integrity Requirement', options: [
      { value: 'X', label: 'Not Defined (X)' },
      { value: 'L', label: 'Low (L)' },
      { value: 'M', label: 'Medium (M)' },
      { value: 'H', label: 'High (H)' }
    ]},
    { key: 'AR', label: 'Availability Requirement', options: [
      { value: 'X', label: 'Not Defined (X)' },
      { value: 'L', label: 'Low (L)' },
      { value: 'M', label: 'Medium (M)' },
      { value: 'H', label: 'High (H)' }
    ]}
  ];

  const calculateScores = async () => {
    if (!vector) return;

    try {
      const response = await apiService.calculateCVSS({ vector });
      setScores(response.scores);
      setMetrics(response.metrics);
    } catch (error) {
      console.error('Error calculating CVSS scores:', error);
      // Fallback: create basic scores
      setScores({
        base_score: 0.0,
        temporal_score: 0.0,
        environmental_score: 0.0
      });
    }
  };

  const handleVectorChange = (newVector: string) => {
    setVector(newVector);
    if (newVector) {
      calculateScores();
    }
  };

  const handleMetricChange = (key: string, value: string) => {
    const newMetrics = { ...metrics, [key]: value };
    setMetrics(newMetrics);
    
    // Rebuild vector
    const vectorParts = ['CVSS:3.1'];
    baseMetrics.forEach(metric => {
      if (newMetrics[metric.key]) {
        vectorParts.push(`${metric.key}:${newMetrics[metric.key]}`);
      }
    });
    
    if (showAdvanced) {
      temporalMetrics.forEach(metric => {
        if (newMetrics[metric.key]) {
          vectorParts.push(`${metric.key}:${newMetrics[metric.key]}`);
        }
      });
      environmentalMetrics.forEach(metric => {
        if (newMetrics[metric.key]) {
          vectorParts.push(`${metric.key}:${newMetrics[metric.key]}`);
        }
      });
    }
    
    const newVector = vectorParts.join('/');
    setVector(newVector);
    
    // Calculate scores after updating vector
    setTimeout(() => {
      if (newVector) {
        calculateScores();
      }
    }, 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!vector) {
      toast.error('Please provide a valid CVSS vector');
      return;
    }

    setIsSubmitting(true);
    try {
      // Use calculated scores or fallback to 0.0
      const finalScores = scores || {
        base_score: 0.0,
        temporal_score: 0.0,
        environmental_score: 0.0
      };

      const evaluationData = {
        metrics: metrics,
        base_score: finalScores.base_score,
        temporal_score: finalScores.temporal_score,
        environmental_score: finalScores.environmental_score
      };
      
      onSubmit(evaluationData);
    } catch (error) {
      console.error('Error creating evaluation:', error);
      toast.error('Failed to create evaluation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 9.0) return 'bg-red-500 text-white';
    if (score >= 7.0) return 'bg-orange-500 text-white';
    if (score >= 4.0) return 'bg-yellow-500 text-black';
    return 'bg-green-500 text-white';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="glass">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Create CVSS Evaluation
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* CVSS Vector Input */}
                  <div className="space-y-2">
                    <Label htmlFor="vector">CVSS Vector</Label>
                    <Input
                      id="vector"
                      value={vector}
                      onChange={(e) => handleVectorChange(e.target.value)}
                      placeholder="CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H"
                      className="font-mono"
                    />
                    <p className="text-sm text-muted-foreground">
                      Enter a CVSS vector or use the form below to build one
                    </p>
                  </div>

                  {/* Scores Display */}
                  {scores && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/20 rounded-lg">
                      <div className="text-center">
                        <Label className="text-sm font-medium">Base Score</Label>
                        <Badge className={`mt-2 ${getScoreColor(scores.base_score)}`}>
                          {scores.base_score?.toFixed(1) || 'N/A'}
                        </Badge>
                      </div>
                      <div className="text-center">
                        <Label className="text-sm font-medium">Temporal Score</Label>
                        <Badge variant="outline" className="mt-2">
                          {scores.temporal_score?.toFixed(1) || 'N/A'}
                        </Badge>
                      </div>
                      <div className="text-center">
                        <Label className="text-sm font-medium">Environmental Score</Label>
                        <Badge variant="outline" className="mt-2">
                          {scores.environmental_score?.toFixed(1) || 'N/A'}
                        </Badge>
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Base Metrics */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Base Metrics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {baseMetrics.map((metric) => (
                        <div key={metric.key} className="space-y-2">
                          <Label htmlFor={metric.key}>{metric.label}</Label>
                          <Select
                            value={metrics[metric.key] || ''}
                            onValueChange={(value) => handleMetricChange(metric.key, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={`Select ${metric.label}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {metric.options.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Advanced Metrics Toggle */}
                  <div className="flex items-center justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      {showAdvanced ? 'Hide' : 'Show'} Advanced Metrics
                    </Button>
                  </div>

                  {/* Temporal Metrics */}
                  {showAdvanced && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Temporal Metrics</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {temporalMetrics.map((metric) => (
                          <div key={metric.key} className="space-y-2">
                            <Label htmlFor={metric.key}>{metric.label}</Label>
                            <Select
                              value={metrics[metric.key] || ''}
                              onValueChange={(value) => handleMetricChange(metric.key, value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={`Select ${metric.label}`} />
                              </SelectTrigger>
                              <SelectContent>
                                {metric.options.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Environmental Metrics */}
                  {showAdvanced && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Environmental Metrics</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {environmentalMetrics.map((metric) => (
                          <div key={metric.key} className="space-y-2">
                            <Label htmlFor={metric.key}>{metric.label}</Label>
                            <Select
                              value={metrics[metric.key] || ''}
                              onValueChange={(value) => handleMetricChange(metric.key, value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={`Select ${metric.label}`} />
                              </SelectTrigger>
                              <SelectContent>
                                {metric.options.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting || !vector}>
                      {isSubmitting ? 'Creating...' : 'Create Evaluation'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
