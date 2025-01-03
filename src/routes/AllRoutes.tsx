
import { Routes, Route } from 'react-router-dom';

import 'bootstrap/dist/css/bootstrap.min.css';

import { Home } from './home/Home';
import { View } from './view/View';


export function AllRoutes ()
{
	return (
		<Routes>
			<Route path='/:type/:identifier' element={<View />} />
			<Route index element={<Home />} />
		</Routes>
	);
}
