
import { Table } from 'react-bootstrap';

import { ShowDTO } from '../../DTOs/ShowDTO';

import { EpisodeDurationConverter } from '../../tools/converters/EpisodeDurationConverter';
import { GenresConverter } from '../../tools/converters/GenresConverter';
import { ReleaseDateConverter } from '../../tools/converters/ReleaseDateConverter';
import { StatusConverter } from '../../tools/converters/StatusConverter';
import { TotalDurationConverter } from '../../tools/converters/TotalDurationConverter';
import { TypeConverter } from '../../tools/converters/TypeConverter';


export interface InformationProps
{
	data : ShowDTO;
}

export function Information ({ data }: InformationProps)
{
	return (
		<Table hover style={{ fontSize: '.875rem' }}>
			<tbody>
				<tr>
					<td>Тип:</td>
					<td>
						<TypeConverter data={ data.kind } />
					</td>
				</tr>

				<tr>
					<td>Эпизоды:</td>
					<td>{ data.episodes }</td>
				</tr>

				<tr>
					<td>Длительность эпизода:</td>
					<td>
						<EpisodeDurationConverter duration={ data.duration } />
						<TotalDurationConverter duration={ data.duration } episodes={ data.episodes } />
					</td>
				</tr>

				<tr>
					<td>Статус:</td>
					<td>
						<StatusConverter data={ data.status } />
						<ReleaseDateConverter start_date={ data.aired_on } end_date={ data.released_on } />
					</td>
				</tr>

				<tr>
					<td>Жанры:</td>
					<td>
						<GenresConverter genres={ data.genres } />
					</td>
				</tr>

				<tr>
					<td>Рейтинг:</td>
					<td>{ data.rating }</td>
				</tr>

				<tr>
					<td>По-английски:</td>
					<td>
						{ data.english.filter(text => text).map(text => <div>{ text }</div>) }
					</td>
				</tr>

				<tr>
					<td>По-японски:</td>
					<td>
						{ data.japanese.filter(text => text).map(text => <div>{ text }</div>) }
					</td>
				</tr>

				<tr>
					<td>Другие названия:</td>
					<td>
						{ data.synonyms.filter(text => text).map(text => <div>{ text }</div>) }
					</td>
				</tr>
			</tbody>
		</Table>
	);
}
