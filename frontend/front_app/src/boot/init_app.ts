import { defineBoot } from '#q-app/wrappers'
import app from 'src/services/app'


export default defineBoot(async (/* { app, router, ... } */) => {
    await app.init()
})
