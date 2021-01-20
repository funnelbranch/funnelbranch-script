type SubmitMatchRequest = {
  projectId: string;
  visitorId: string;
  controlGroup: string;
  trigger: {
    url?: string;
    event?: string;
  };
};
export function submitMatch() {
  console.log('submitting match');
}
