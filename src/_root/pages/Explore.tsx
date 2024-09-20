import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import GridPostList from "@/components/ui/shared/GridPostList";
import Loader from "@/components/ui/shared/Loader";
import SearchResults from "@/components/ui/shared/SearchResults";
import useDebounce from "@/hooks/useDebounce";
import { useGetPosts, useSearchPosts } from "@/lib/react-query/queriesAndMutations";
import { useInView } from 'react-intersection-observer';

const Explore = () => {
  const [ref, inView] = useInView();
  const [searchValue, setSearchValue] = useState("");
  const debounceValue = useDebounce(searchValue, 500);

  const [userLocation, setUserLocation] = useState<{ latitude: number | null; longitude: number | null }>({
    latitude: null,
    longitude: null,
  });
  
  const [distanceFilter, setDistanceFilter] = useState("All");
  const distanceOptions = ["5 km", "10 km", "25 km", "50 km", "100 km", "All"];
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);  // State for dropdown visibility

  // Get user's location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.error("Error getting location:", error);
      }
    );
  }, []);

  const { data: posts, fetchNextPage, hasNextPage } = useGetPosts(
    userLocation.latitude || 0,
    userLocation.longitude || 0,
    distanceFilter === "All" ? 0 : parseFloat(distanceFilter)
  );
  
  const { data: searchedPosts, isFetching: isSearchFetching } = useSearchPosts(debounceValue);

  // Fetch more posts when in view or search changes
  useEffect(() => {
    if (inView && !searchValue) fetchNextPage();
  }, [inView, searchValue]);

  const handleDistanceChange = (distance: string) => {
    setDistanceFilter(distance);
    setIsDropdownOpen(false);  // Close the dropdown after selecting an option
  };

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);  // Toggle dropdown visibility
  };

  if (!posts) {
    return (
      <div className="flex-center w-full h-full">
        <Loader />
      </div>
    );
  }

  const shouldShowSearchResults = searchValue !== "";
  const shouldShowPosts =
    !shouldShowSearchResults && posts.pages.every((item) => item?.documents.length === 0);

  return (
    <div className="explore-container">
      <div className="explore-inner_container">
        <h2 className="h3-bold md:h2-bold w-full">Search Posts</h2>
        <div className="flex gap-1 px-4 w-full rounded-lg bg-dark-4">
          <img
            src="/assets/icons/search.svg"
            width={24}
            height={24}
            alt="search"
          />
          <Input
            type="text"
            placeholder="Search"
            className="explore-search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-between w-full max-w-5xl mt-16 mb-7 ">
        <h2 className="body-bold md:h3-bold">Popular Today</h2>
        <div className="relative">
          <button
            onClick={toggleDropdown}  // Toggle dropdown on click
            className="flex-center gap-3 bg-dark-3 rounded-xl px-4 py-2 cursor-pointer"
          >
            <p className="small-medium md:base_medium text-light-2">{distanceFilter}</p>
            <img
              src="/assets/icons/filter.svg"
              width={20}
              height={20}
              alt="filter"
            />
          </button>
          {isDropdownOpen && (  // Only show dropdown if it's open
            <ul className="absolute mt-2 bg-dark-4 shadow-lg rounded-lg text-white">
              {distanceOptions.map((option) => (
                <li
                  key={option}
                  className="cursor-pointer hover:bg-gray-200 px-4 py-2"
                  onClick={() => handleDistanceChange(option)}
                >
                  {option}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-9 w-full max-w-5xl">
        {shouldShowSearchResults ? (
          <SearchResults
            isSearchFetching={isSearchFetching}
            searchedPosts={searchedPosts}
          />
        ) : shouldShowPosts ? (
          <p className="text-light-4 mt-10 text-center w-full">End of posts</p>
        ) : (
          posts.pages.map((item, index) => (
            <GridPostList key={`page-${index}`} posts={item.documents} />
          ))
        )}
      </div>

      {hasNextPage && !searchValue && (
        <div ref={ref} className="mt-10">
          <Loader />
        </div>
      )}
    </div>
  );
};

export default Explore;
