# realsingles/wep Project Tasks

## Code Updates
- [ ] 


## Bugs:
- [ ] /onboarding
    - [x] The api doesn't update the percentage in real time
        - [ ] Tested and working
    - [x] Some places offer 'prefer not to say' for the page, but that is only valid for individual items
        - [ ] Tested and working
    - [ ] No page should ever get a scroll on mobile, but on a few of them, due to wasted space, when the keyboard comes up, it scrolls but it's unecessary, if we manage the space well. For page that could have the keyboard, we have less space to use than the ones that don't have keyboard, but at lease one of the ones without a keyboard is scolling as well.

- [ ] Discover
    - [ ] if you go to a profile you've already liked, it should not let you take the same action you've already taken, such as "Like" when you've already liked them. This is causig a multitude of differnt bugs, including allowing users to match multile times.
    - [ ] Discover is sometimes showing people you've already matched with and gets into a circle
        - [ ] It allowd me to match 3 times with the same person. In addition to making sure the action is not avaialble, we also need to update the api, server logic and possibly even the dataqbase to ensure that we don't let people have multiple amtches with the same people that are all in the state suggesting it's not complete yet. (It would be differnt if the match is expired or something like that)


## Feature Problems or buildouts
- [ ] admin/products - appears to be completely dummy code without db integration, apis and logic
    - [ ] Find out what we already have with Supabase MCP tool, apis, server, etc.
    - [ ] Build whatever is missing
    - [ ] Imaage, Name, Description, Active/not, Points, Value
    - [ ] User facing options would allow a user to get these products with points and set the ship to for either themselves or choosing another member (The first user doesn't get to see the other person's address) - Like a shopping card system.

- [ ] Speed Dating System:
    - [ ] Explore how we can make speed dating work
    - [ ] 

- [ ] Matchmakers System:
    - [ ] People have a role as a matchmaker and they are able to go through profiles and match, etc.
    - [ ] Add user type for "Matchmaker" role
    - [ ] Matchmakers can use much of the admin system
    - [ ] For now, the feature will be 'coming soon' and shown at the bottom of the explore page
    - [ ] Build matchmaker dashboard (using admin system components)
    - [ ] Create profile review/matching interface - the Algorithm simulator sort of does this to a certain extent
    - [ ] Implement match suggestion workflow
    - [ ] Add matchmaker assignment system


### Speed Dating System:
- [ ] Explore how we can make speed dating work functionally
- [ ] Technical implementation planning


### LIVEKIT INTEGRATION
    - [ ] See /LIVEKIT_INTEGRATION_GUIDE.md
    - This is to be set up and completly replace anythinhg sert up previously for Agora
    - If any signups, keys or things are required, a set of tasks must be created for Arman to complete


### Points System
- [ ] We have a points system and a page and we even track referrals. We also have products that have points values associated with them. But we're missing core features to make this all work properly.
- [ ] http://localhost:3000/refer - This page shows the basics
- [ ] Not sure where the logic is for how to earn points and all of that. We don't seem to have that. We need to make sure that people can earn points and we have a simple way of managing how they earn points, how many, etc.