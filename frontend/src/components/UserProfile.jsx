import { react, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiURL } from '../App';

const UserProfile = () => {

    const user_id = useParams().userId;

    const [data, setData] = useState(null);
    const [loadState, setLoadState] = useState("start");


    const getUserInfo = async () => {

        try {

            const response = await fetch(`${apiURL}/users/${user_id}`);

            if (!response.ok) {
                // maybe profile is private, unavailable, you are blocked, etc
                throw new Error("Failed to load profile");
            }

            // should contain everything to display their profile
            const userData = await response.text();
            console.log("Recieved: " + (userData));
            setData(userData);
            setLoadState('loaded');

        } catch (err) {
            console.error(err);
            setLoadState('error');
        }
    }

    useEffect(() => {
        async function getData() {
            await getUserInfo();
        }

        setLoadState("loading");
        getData();

    }, []);



    return <div>
        <h1>Displaying information for user # {user_id}</h1>
        <div>
            {(data || "Loading...")}
        </div>
    </div>
}

export default UserProfile;