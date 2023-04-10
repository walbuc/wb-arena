import type {LoaderArgs} from '@remix-run/node'
import {json} from '@remix-run/node'
import {Outlet, useLoaderData} from '@remix-run/react'
import {requireUserId} from '~/session.server'
import {useUser} from '~/utils'
import {getNoteListItems} from '~/models/note.server'
import {Navbar} from '~/components/Nav'

export async function loader({request}: LoaderArgs) {
  const userId = await requireUserId(request)
  const noteListItems = await getNoteListItems({userId})
  return json({noteListItems})
}

export default function BlogPage(args: LoaderArgs) {
  const data = useLoaderData<typeof loader>()
  const user = useUser()

  return (
    <div className="flex h-full min-h-screen flex-col">
      <Navbar />
      <main className="flex h-full">
        <div className="flex-1 p-4">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
