
import { Routes, Route } from 'react-router-dom';

import 'bootstrap/dist/css/bootstrap.min.css';

import { Home } from './home/Home';


export function AllRoutes ()
{
	return (
		<Routes>
			<Route index element={<Home />} />
		</Routes>
	);
}
