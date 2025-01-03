
import { useParams } from 'react-router-dom';

import { Foundation } from '../../components/foundation/Foundation';

import { Entry } from './Entry';


export function View ()
{
	const { type, identifier } = useParams() as Readonly<Record<string, string>>;

	return (
		<Foundation>
			<Entry {...{ type, identifier }} />
		</Foundation>
	)
}
