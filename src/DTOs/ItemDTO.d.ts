
export interface ItemDTO
{
	id   : number;
	url  : string;
	name : string;

	image: {
		original : string;
		preview  : string;
		x96      : string;
		x48      : string;
	};

	russian : string;

	kind   : string;
	score  : string;
	status : string;

	episodes       : number;
	episodes_aired : number;

	aired_on    : string | null;
	released_on : string | null;
}
