
import { Stack, Nav } from 'react-bootstrap';

import { GenreDTO } from '../../DTOs/ShowDTO';


export interface GenresConverterProps
{
	genres : GenreDTO[];
}

export function GenresConverter ({ genres }: GenresConverterProps)
{
	return (
		<Stack direction='horizontal' gap={2}>
			{ genres.map(genre => (
				<Nav.Link
					key       = { genre.id }
					href      = { 'https://shikimori.one/animes/genre/' + genre.id }
					className = 'p-1 border rounded'
				>
					{ genre.russian }
				</Nav.Link>
			)) }
		</Stack>
	);
}
