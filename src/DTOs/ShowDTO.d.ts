
import { ItemDTO } from './ItemDTO';


export interface RateStatsDTO<TName extends string | number>
{
	name  : TName;
	value : number;
}

export interface GenreDTO
{
	id : number;

	name    : string;
	russian : string;

	kind       : 'genre';
	entry_type : 'Anime';
}

export interface StudioDTO
{
	id : number;

	name          : string;
	filtered_name : string;

	real  : boolean;
	image : string;
}

export interface VideoDTO
{
	id : number;

	url        : string;
	image_url  : string;
	player_url : string;

	name    : string;
	kind    : 'pv';
	hosting : 'youtube';
}

export interface ScreenshotDTO
{
	original : string;
	preview  : string;
}

export interface UserRateDTO
{
	id     : number;
	score  : number;
	status : 'completed';

	text      : string;
	text_html : string;

	episodes  : number;
	chapters  : number;
	volumes   : number;
	rewatches : number;

	created_at : string;
	updated_at : string;
}

export interface ShowDTO extends ItemDTO
{
	rating : string;

	english  : (string | null)[];
	japanese : (string | null)[];
	synonyms : string[];

	license_name_ru : null;
	duration        : number;

	description        : string | null;
	description_html   : string;
	description_source : null;

	franchise : string | null;
	favoured  : boolean;
	anons     : boolean;
	ongoing   : boolean;

	thread_id      : number;
	topic_id       : number;
	myanimelist_id : number;

	rates_scores_stats   : RateStatsDTO<number>[];
	rates_statuses_stats : RateStatsDTO<string>[];

	/**
	 * @example "2022-11-26T17:19:33.411+03:00"
	 */
	updated_at      : string;
	next_episode_at : string | null;

	fansubbers  : string[];
	fandubbers  : string[];
	licensors   : [];
	genres      : GenreDTO[];
	studios     : StudioDTO[];
	videos      : VideoDTO[];
	screenshots : ScreenshotDTO[];

	user_rate : UserRateDTO | null;
}
