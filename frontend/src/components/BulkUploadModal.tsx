import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Download, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { apiService } from '@/services/api';
import { toast } from 'sonner';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface UploadResult {
  total: number;
  created: number;
  skipped: number;
  errors: string[];
}

export const BulkUploadModal: React.FC<BulkUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'text/csv' || file.name.endsWith('.csv') || 
          file.type === 'application/json' || file.name.endsWith('.json')) {
        setSelectedFile(file);
        setUploadResult(null);
      } else {
        toast.error('Please select a CSV or JSON file');
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    let loadingToast: string | number | undefined;
    try {
      loadingToast = toast.loading('Uploading vulnerabilities...');
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const response = await apiService.bulkUpload(formData);
      toast.dismiss(loadingToast);
      
      setUploadResult(response.results);
      
      if (response.results.created > 0) {
        toast.success(`Successfully uploaded ${response.results.created} vulnerabilities!`);
        onSuccess();
      }
      
      if (response.results.errors.length > 0) {
        toast.error(`${response.results.errors.length} errors occurred during upload`);
      }
      
    } catch (error) {
      console.error('Bulk upload failed:', error);
      if (loadingToast) toast.dismiss(loadingToast);
      toast.error('Failed to upload file. Please check the format and try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    let loadingToast: string | number | undefined;
    try {
      loadingToast = toast.loading('Downloading template...');
      await apiService.downloadTemplate();
      toast.dismiss(loadingToast);
      toast.success('Template downloaded successfully!');
    } catch (error) {
      console.error('Template download failed:', error);
      if (loadingToast) toast.dismiss(loadingToast);
      toast.error('Failed to download template');
    }
  };

  const handleValidateFile = async () => {
    if (!selectedFile) return;

    let loadingToast: string | number | undefined;
    try {
      loadingToast = toast.loading('Validating file...');
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const response = await apiService.validateFile(formData);
      toast.dismiss(loadingToast);
      
      const { validation } = response;
      
      if (validation.valid_rows === validation.total_rows) {
        toast.success(`File is valid! ${validation.valid_rows} rows ready for upload.`);
      } else {
        toast.error(`File has ${validation.invalid_rows} invalid rows. Check the errors.`);
      }
      
    } catch (error) {
      console.error('File validation failed:', error);
      if (loadingToast) toast.dismiss(loadingToast);
      toast.error('Failed to validate file');
    }
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
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="glass">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Bulk Upload Vulnerabilities
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
              <CardContent className="space-y-6">
                {/* Template Download */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Step 1: Download Template</label>
                  <Button
                    onClick={handleDownloadTemplate}
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download CSV Template
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Download the template to see the required format for bulk upload
                  </p>
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Step 2: Select File</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept=".csv,.json"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600">
                        Click to select CSV or JSON file
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Supports CSV and JSON formats
                      </p>
                    </label>
                  </div>
                  {selectedFile && (
                    <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                      <FileText className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-800">{selectedFile.name}</span>
                      <Badge variant="secondary" className="ml-auto">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </Badge>
                    </div>
                  )}
                </div>

                {/* File Validation */}
                {selectedFile && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Step 3: Validate File (Optional)</label>
                    <Button
                      onClick={handleValidateFile}
                      variant="outline"
                      className="w-full"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Validate File
                    </Button>
                  </div>
                )}

                {/* Upload Results */}
                {uploadResult && (
                  <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium">Upload Results</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{uploadResult.total}</div>
                        <div className="text-gray-600">Total</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{uploadResult.created}</div>
                        <div className="text-gray-600">Created</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{uploadResult.skipped}</div>
                        <div className="text-gray-600">Skipped</div>
                      </div>
                    </div>
                    {uploadResult.errors.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-red-600">Errors:</p>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {uploadResult.errors.map((error, index) => (
                            <p key={index} className="text-xs text-red-500">{error}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={isUploading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={isUploading || !selectedFile}
                    className="flex items-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Upload Vulnerabilities
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
