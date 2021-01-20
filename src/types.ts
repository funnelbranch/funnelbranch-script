export type Options = {
  projectId: string;
};

export type SubmitMatchRequest = {
  projectId: string;
  visitorId: string;
  controlGroup: string;
  trigger: {
    url?: string;
    event?: string;
  };
};
