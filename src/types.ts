export type Options = {
  projectId: string;
  controlGroup?: string;
  submitOnLocalhost?: boolean;
  trackClientUrlChanges?: boolean;
  trackClientHashChanges?: boolean;
};

export type SubmitMatchRequest = {
  // Important: make sure to update the comparison method (__areTheSame) if new fields are added/removed !!!
  projectId: string;
  visitorId: string;
  controlGroup?: string;
  trigger: {
    url?: string;
    event?: string;
  };
};

export type LocationCallback = (location: Location) => void;
