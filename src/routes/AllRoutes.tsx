
import { Routes, Route } from 'react-router-dom';

import { Home } from './home/Home';


export function AllRoutes ()
{
	return (
		<Routes>
			<Route index element={<Home />} />
		</Routes>
	);
}
