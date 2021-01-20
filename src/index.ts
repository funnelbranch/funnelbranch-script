type Options = {
  projectId: string;
};

class Funnelbranch {
  public static initialize(options: Options) {
    return new Funnelbranch(options);
  }

  private constructor(private readonly options: Options) {
    // TODO: start tracking URLs
  }

  public submitEvent(event: string) {
    console.log(`Project: ${this.options.projectId}, Event: ${event}`);
  }

  public submitUrl(url: string) {
    console.log(`Project: ${this.options.projectId}, URL: ${url}`);
  }
}

(window as any).Funnelbranch = Funnelbranch;
