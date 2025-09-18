import service from '@/utils/request'

export const test = () => {
    return service({
        url: '/test',
        method: 'get',
    })
}