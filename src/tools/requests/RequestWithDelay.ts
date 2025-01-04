
import { RequestWithCancellation } from './RequestWithCancellation';


export class RequestWithDelay extends RequestWithCancellation
{
	private readonly timer = setTimeout(this.handle.bind(this), this.delay);

	public constructor
	(
		private readonly delay : number,
		...options             : ConstructorParameters<typeof RequestWithCancellation>
	)
	{
		super(...options);
	}

	public override dispose (): void
	{
		super.dispose();

		clearTimeout(this.timer);
	}
}
