import * as core from '@actions/core'
import GoogleTranslate from '@tomsun28/google-translate-api'
import { isTargetLanguage } from './isTargetLanguage'

/**
 *
 * @param text
 * @param language ISO 639-1 Language Code
 * @returns
 */
export async function translate(
    text: string,
    language = 'en',
): Promise<string | undefined> {
    try {
        const resp = await GoogleTranslate(text, { to: language })
        return resp.text !== text ? resp.text : ''
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
        core.error(err)
        core.setFailed(err.message)
    }
}

const MAGIC_JOIN_STRING = '@@===='
export const translateText = {
    parse(text?: string) {
        if (!text) {
            return [undefined, undefined]
        }

        const translateBody: string[] = text.split(MAGIC_JOIN_STRING)
        return [translateBody?.[0]?.trim(), translateBody[1].trim()]
    },
    stringify(body?: string, title?: string, language = 'eng') {
        const needCommitComment =
      body && body !== 'null' && !isTargetLanguage(body, language)
        const needCommitTitle =
      title && title !== 'null' && !isTargetLanguage(title, language)

        const translateOrigin = null

        if (!needCommitComment) {
            core.info('Detect the issue comment body is english already, ignore.')
        }
        if (!needCommitTitle) {
            core.info('Detect the issue title body is english already, ignore.')
        }
        if (!needCommitTitle && !needCommitComment) {
            core.info('Detect the issue do not need translated, return.')
            return translateOrigin
        }

        return [body || 'null', title].join(MAGIC_JOIN_STRING)
    },
}
