import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { fetchAllData } from '../../utils/fetchAllData';
import { addMissingRows } from '../../utils/updateExcel';
import { getNewDataWithExcel } from '../../utils/getNewData';
import type { usingDataProps } from '../../type';
import EpisodeList from './EpisodeList';
import syncNewDataToExcel, { syncNewDatatoExcel3 } from '../../utils/syncNewEpisodesToExcel';
import Button from '../../components/Button';
import LoadingOverlay from '../../components/LoadingOverlay';
import getSheetList from '../../utils/getSheetList';
import { useLoginTokenStore } from '../../store/useLoginTokenStore';
import getTableList from '../../utils/getTableList';

const CATEGORY = 'episode';

const EpisodeLayout = () => {
  const { loginToken } = useLoginTokenStore();
  const [newEpi, setNewEpi] = useState<usingDataProps[]>([]);
  const [loading, setLoading] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  const [allLoading, setAllLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [sheetList, setSheetList] = useState<{ id: string; name: string }[]>(
    []
  );
  const [selectedSheet, setSelectedSheet] = useState(
    localStorage.getItem('sheetName') || ''
  );
  const [selectedTable, setSelectedTable] = useState('');
  const [tableList, setTableList] = useState<{ id: string; name: string }[]>(
    []
  );

  useEffect(() => {
    if (loginToken) {
      getSheetList(loginToken, import.meta.env.VITE_FILE_ID).then(setSheetList);
    }
  }, [loginToken]);

  useEffect(() => {
    if (loginToken && selectedSheet) {
      const fileId = import.meta.env.VITE_FILE_ID;
      getTableList(loginToken, fileId, selectedSheet).then(setTableList);
    } else {
      setTableList([]);
      setSelectedTable('');
    }
  }, [loginToken, selectedSheet]);

  const handleSelectSheet = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedSheet(value);
    localStorage.setItem('sheetName', value);
  };

  const handleSelectTable = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedTable(value);
    localStorage.setItem('tableName', value);
  };

  const handleUpdateExcel = async () => {
    if (!loginToken) return toast.warn('로그인을 먼저 해주세요!');
    const result = window.confirm(
      `${localStorage.getItem('sheetName')} 시트에 누락된 데이터를 추가합니다.`
    );
    if (result) {
      setAllLoading(true);
      const allData = await fetchAllData(CATEGORY, setProgress);
      await addMissingRows(allData, loginToken, setProgress, CATEGORY);
      setProgress('');
      setAllLoading(false);
    }
  };

  const handleSyncExcel = async () => {
    if (!selectedTable) return toast.warn('테이블을 선택해주세요!');
    if (!loginToken) return toast.warn('로그인을 먼저 해주세요!');
    setExcelLoading(true);
    await syncNewDatatoExcel3(newEpi, loginToken, selectedTable);
    setProgress('');
    setExcelLoading(false);
  };

  const handleSearchNew = async () => {
    setLoading(true);
    const newList = await getNewDataWithExcel();
    setProgress('');
    setNewEpi(newList);
    setLoading(false);
  };

  return (
    <div className='p-10 h-[80%]'>
      <h1 className='text-3xl font-bold mb-4 indent-1'>에피소드 관리</h1>
      <div className='flex gap-2'>
        <Button onClick={handleUpdateExcel}>전체 에피소드 시트로 변환</Button>
        <Button
          href={import.meta.env.VITE_ADMIN_EPI_URL}
          target='_blank'
          rel='noopener noreferrer'
        >
          대시보드 이동
        </Button>
        <LoadingOverlay
          progress={progress}
          vertical={false}
          loading={allLoading}
        ></LoadingOverlay>
      </div>
      <div className='w-full rounded-2xl bg-white h-full mt-4 p-8'>
        <div className='flex justify-between items-center h-[10%]'>
          <h3 className='mb-6 text-[#3c25cc] font-semibold'>
            새로운 에피소드 총{' '}
            <span className='font-extrabold'>{newEpi.length}</span>개
          </h3>
          <div className='flex gap-8 items-center'>
            <LoadingOverlay
              progress={progress}
              vertical={false}
              loading={excelLoading}
            />
            <button
              onClick={() => handleSearchNew()}
              className='cursor-pointer flex gap-2'
            >
              <img src='/redo.svg' alt='재검색' width={18} height={18} /> 재검색
            </button>
            <select
              value={selectedSheet}
              onChange={handleSelectSheet}
              className='w-fit appearance-none border border-gray-300 px-4 py-2 pr-10 rounded-lg bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition cursor-pointer'
            >
              <option value=''>시트 선택</option>
              {sheetList.map((sheet) => (
                <option key={sheet.id} value={sheet.name}>
                  {sheet.name}
                </option>
              ))}
            </select>
            <select
              value={selectedTable}
              onChange={handleSelectTable}
              className='w-fit appearance-none border border-gray-300 px-4 py-2 pr-10 rounded-lg bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition cursor-pointer'
              disabled={!tableList.length}
            >
              <option value=''>
                {tableList.length > 0 ? '테이블 선택' : '테이블 없음'}
              </option>
              {tableList.map((table) => (
                <option key={table.id} value={table.name} >
                  {table.name}
                </option>
              ))}
            </select>
            <Button 
              onClick={handleSyncExcel}
            >
              Excel 동기화
            </Button>
          </div>
        </div>
        <div className='w-full h-[90%] flex flex-col'>
          <div className='min-w-max flex font-bold py-5'>
            <p className='w-[7%] px-2'>ID</p>
            <p className='w-[7%] px-2'>활성화</p>
            <p className='w-[12%] px-2'>채널명</p>
            <p className='w-[13%] px-2'>에피소드명</p>
            <p className='w-[12%] px-2'>게시일</p>
            <p className='w-[12%] px-2'>등록일</p>
            <p className='w-[9%] px-2'>에피소드 시간</p>
            <p className='w-[7%] px-2'>좋아요수</p>
            <p className='w-[7%] px-2'>청취수</p>
            <p className='w-[7%] px-2'>tags</p>
            <p className='w-[7%] px-2'>tagsadded</p>
          </div>
          <LoadingOverlay progress={progress} loading={loading}>
            새로운 에피소드 목록을 불러오는 중입니다.
            <br />
            잠시만 기다려주세요!
          </LoadingOverlay>
          {!loading && <EpisodeList data={newEpi} />}
        </div>
      </div>
    </div>
  );
};

export default EpisodeLayout;
