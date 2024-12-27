
import { Stack } from 'react-bootstrap';

import { Header } from '../../components/header/Header';
import { Sidebar } from '../../components/sidebar/Sidebar';


export function Home ()
{
	return (
		<>
			<Header />

			<Stack className='p-2 bg-light'>
				<Sidebar />
			</Stack>
		</>
	);
}
