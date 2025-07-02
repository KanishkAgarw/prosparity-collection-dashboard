
import React, { useState, useEffect } from "react";
import { Application } from "@/types/application";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ApplicationHeader from "./details/ApplicationHeader";
import DetailsTab from "./details/DetailsTab";
import ContactsTab from "./details/ContactsTab";
import StatusTab from "./details/StatusTab";
import CommentsTab from "./details/CommentsTab";

interface ApplicationDetailsPanelProps {
  application: Application;
  onClose: () => void;
  onSave: (updatedApplication: Application) => void;
  onDataChanged: () => void;
  selectedEmiMonth?: string | null;
}

const ApplicationDetailsPanel: React.FC<ApplicationDetailsPanelProps> = ({
  application,
  onClose,
  onSave,
  onDataChanged,
  selectedEmiMonth
}) => {
  const [activeTab, setActiveTab] = useState("details");

  return (
    <div className="bg-white shadow-lg border-l border-gray-200 h-full flex flex-col">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 border-b border-gray-200 p-4">
        <ApplicationHeader 
          application={application} 
          onClose={onClose}
          selectedEmiMonth={selectedEmiMonth}
        />
      </div>

      {/* Scrollable Content Area - Fixed CSS */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
              <TabsTrigger value="status">Status</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
            </TabsList>

            <div className="space-y-4">
              <TabsContent value="details" className="mt-0">
                <DetailsTab application={application} />
              </TabsContent>

              <TabsContent value="contacts" className="mt-0">
                <ContactsTab 
                  application={application}
                  onDataChanged={onDataChanged}
                  selectedEmiMonth={selectedEmiMonth}
                />
              </TabsContent>

              <TabsContent value="status" className="mt-0">
                <StatusTab 
                  application={application}
                  onDataChanged={onDataChanged}
                  selectedEmiMonth={selectedEmiMonth}
                />
              </TabsContent>

              <TabsContent value="comments" className="mt-0">
                <CommentsTab 
                  application={application}
                  onDataChanged={onDataChanged}
                  selectedEmiMonth={selectedEmiMonth}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetailsPanel;
