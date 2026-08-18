import React from 'react';
import { PresentationPayload, PresentationMode } from '../../types/workspace';
import { OverviewPresentation } from './OverviewPresentation';
import { ParagraphPresentation } from './ParagraphPresentation';
import { StructurePresentation } from './StructurePresentation';
import { CodePresentation } from './CodePresentation';
import { DataPresentation } from './DataPresentation';

interface WorkspaceRouterProps {
  payload: PresentationPayload;
  currentMode: PresentationMode;
}

export const WorkspaceRouter: React.FC<WorkspaceRouterProps> = ({ payload, currentMode }) => {
  switch (currentMode) {
    case 'PARAGRAPH':
      return <ParagraphPresentation paragraph={payload.paragraph} />;

    case 'STRUCTURE':
      return <StructurePresentation structure={payload.structure} />;

    case 'CODE':
      return <CodePresentation codeData={payload.code} />;

    case 'DATA':
      return <DataPresentation data={payload.data} />;

    case 'OVERVIEW':
    default:
      return (
        <OverviewPresentation
          overview={payload.overview}
          sourcePrompt={payload.sourcePrompt}
          metadata={payload.metadata}
        />
      );
  }
};
