
export class RequestWithCancellation
{
	private readonly abort = new AbortController();

	public async handle ()
	{
		try
		{
			const resource = await fetch(this.address, { signal: this.abort.signal });
			const response = await resource.json();

			this.handler(response);
		}
		catch (error)
		{
			if (error instanceof Error && error.name === 'AbortError')
			{
				return;
			}
	
			throw error;
		}
	}

	public constructor
	(
		private readonly address : RequestInfo | URL,
		private readonly handler : (response: unknown) => void,
	)
	{
	}

	public dispose (): void
	{
		this.abort.abort();
	}
}
