// src/components/Dev/DesignSystemScreen.jsx
import { useState } from 'react';
import PageHeader from '../Common/PageHeader';
import Cover from '../Common/Cover';
import BookCard from '../Common/BookCard';
import ListCard from '../Common/ListCard';
import EmptyState from '../Common/EmptyState';
import Skeleton from '../Common/Skeleton';
import Sheet from '../Common/Sheet';
import styles from './DesignSystemScreen.module.css';
import { Button } from '@react-spectrum/s2/Button';
import { ActionButton } from '@react-spectrum/s2/ActionButton';
import { SearchField } from '@react-spectrum/s2/SearchField';
import { Picker, PickerItem } from '@react-spectrum/s2/Picker';
import { ProgressBar } from '@react-spectrum/s2/ProgressBar';
import { Switch } from '@react-spectrum/s2/Switch';
import { StatusLight } from '@react-spectrum/s2/StatusLight';
import { Avatar } from '@react-spectrum/s2/Avatar';
import { ToggleButton } from '@react-spectrum/s2/ToggleButton';
import { ToggleButtonGroup } from '@react-spectrum/s2/ToggleButtonGroup';

const VN_TEST_STRING = 'Ắ Ằ Ẳ Ẵ Ặ Ế Ề Ể Ễ Ệ Ớ Ờ Ở Ỡ Ợ Ứ Ừ Ử Ữ Ự';

export default function DesignSystemScreen() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [themeMode, setThemeMode] = useState('light');

  const toggleTheme = () => {
    const next = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(next);
    document.documentElement.setAttribute('data-app-theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const sampleBook = {
    id: 'demo-kieu',
    title: 'Truyện Kiều (Đoạn Trường Tân Thanh)',
    author: 'Đại thi hào Nguyễn Du',
    format: 'epub',
    progressPercent: 42,
    coverUrl: '',
  };

  const sampleList = {
    id: 'list-demo',
    name: 'Tủ sách Văn học Kinh điển',
    description: 'Bộ sưu tập những kiệt tác văn học được yêu thích nhất qua các thời kỳ.',
  };

  return (
    <div className={styles.devContainer}>
      <PageHeader
        supertitle="STYLEGUIDE & COMPONENT LAB"
        title="Editorial Design System"
        actions={
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={toggleTheme}
          >
            Đổi sang {themeMode === 'light' ? 'Dark' : 'Light'} Mode
          </button>
        }
      />

      {/* 1. Bảng màu Tokens */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>1. Bảng Màu Sắc (Tokens Palette)</h2>
        <div className={styles.colorGrid}>
          <div className={styles.colorSwatch}>
            <div className={styles.swatchBox} style={{ background: 'var(--bg-base)' }} />
            <div className={styles.swatchMeta}>
              <div className={styles.swatchName}>--bg-base</div>
              <div className={styles.swatchHex}>Warm Paper / Ink</div>
            </div>
          </div>
          <div className={styles.colorSwatch}>
            <div className={styles.swatchBox} style={{ background: 'var(--bg-surface)' }} />
            <div className={styles.swatchMeta}>
              <div className={styles.swatchName}>--bg-surface</div>
              <div className={styles.swatchHex}>Card / Surface</div>
            </div>
          </div>
          <div className={styles.colorSwatch}>
            <div className={styles.swatchBox} style={{ background: 'var(--bg-surface-raised)' }} />
            <div className={styles.swatchMeta}>
              <div className={styles.swatchName}>--bg-surface-raised</div>
              <div className={styles.swatchHex}>Secondary / Chip</div>
            </div>
          </div>
          <div className={styles.colorSwatch}>
            <div className={styles.swatchBox} style={{ background: 'var(--accent)' }} />
            <div className={styles.swatchMeta}>
              <div className={styles.swatchName}>--accent</div>
              <div className={styles.swatchHex}>Amber Terracotta</div>
            </div>
          </div>
          <div className={styles.colorSwatch}>
            <div className={styles.swatchBox} style={{ background: 'var(--text-primary)' }} />
            <div className={styles.swatchMeta}>
              <div className={styles.swatchName}>--text-primary</div>
              <div className={styles.swatchHex}>Charcoal Ink</div>
            </div>
          </div>
          <div className={styles.colorSwatch}>
            <div className={styles.swatchBox} style={{ background: 'var(--text-secondary)' }} />
            <div className={styles.swatchMeta}>
              <div className={styles.swatchName}>--text-secondary</div>
              <div className={styles.swatchHex}>Warm Gray Muted</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Thang Chữ & Kiểm Thử Tiếng Việt */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>2. Thang Chữ & Kiểm Thử Dấu Tiếng Việt</h2>

        <div className={styles.typeRow} style={{ fontFamily: 'var(--font-serif)' }}>
          <span className={styles.typeLabel}>Display (Lora SemiBold 28px)</span>
          <p className={styles.samplePangram} style={{ fontSize: 'var(--font-size-display)', fontWeight: 600 }}>
            Hương hoa ngào ngạt, bóng trăng thanh
          </p>
          <div className={styles.vietnameseCheck}>{VN_TEST_STRING}</div>
        </div>

        <div className={styles.typeRow} style={{ fontFamily: 'var(--font-serif)' }}>
          <span className={styles.typeLabel}>Headline (Lora SemiBold 20px)</span>
          <p className={styles.samplePangram} style={{ fontSize: 'var(--font-size-headline)', fontWeight: 600 }}>
            Trăm năm trong cõi người ta, chữ tài chữ mệnh khéo là ghét nhau
          </p>
          <div className={styles.vietnameseCheck}>{VN_TEST_STRING}</div>
        </div>

        <div className={styles.typeRow} style={{ fontFamily: 'var(--font-sans)' }}>
          <span className={styles.typeLabel}>Body (Be Vietnam Pro 15px Regular)</span>
          <p className={styles.samplePangram} style={{ fontSize: 'var(--font-size-body)' }}>
            Nắng chiều rực rỡ chiếu rọi qua rặng tre đầu ngõ, những trang sách cũ phảng phất mùi giấy mới.
          </p>
          <div className={styles.vietnameseCheck}>{VN_TEST_STRING}</div>
        </div>
      </section>

      {/* 3. Bìa Sách 4 Trạng Thái */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>3. Bìa Sách &lt;Cover&gt; (4 Trạng Thái)</h2>
        <div className={styles.gridCovers}>
          <div className={styles.coverDemoItem}>
            <Cover
              title="Truyện Kiều"
              author="Nguyễn Du"
              format="epub"
            />
            <span className={styles.demoItemLabel}>Bìa tự sinh (Generated)</span>
          </div>

          <div className={styles.coverDemoItem}>
            <Cover
              title="Số Đỏ"
              author="Vũ Trọng Phụng"
              format="pdf"
            />
            <span className={styles.demoItemLabel}>Bìa tự sinh khác sắc độ</span>
          </div>

          <div className={styles.coverDemoItem}>
            <Cover
              type="composite"
              subCovers={['', '', '', '']}
              alt="Danh sách mẫu"
            />
            <span className={styles.demoItemLabel}>Bìa ghép 2×2 (Composite)</span>
          </div>

          <div className={styles.coverDemoItem}>
            <Cover
              type="folder"
              title="Thư mục Tủ sách"
              author="Folder Cover"
              format="folder"
            />
            <span className={styles.demoItemLabel}>Bìa nguồn thư mục</span>
          </div>
        </div>
      </section>

      {/* 4. BookCard & ListCard */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>4. Các Component Thẻ Sách & Danh Sách</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
          <BookCard
            book={sampleBook}
            onOpenBook={() => alert('Mở đọc sách!')}
            onOpenBookInfo={() => setIsSheetOpen(true)}
          />
        </div>

        <div style={{ marginTop: '16px', maxWidth: '420px' }}>
          <ListCard
            list={sampleList}
            books={[sampleBook, sampleBook, sampleBook]}
            onOpenList={() => alert('Mở danh sách!')}
          />
        </div>
      </section>

      {/* 5. Skeleton & EmptyState */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>5. Skeleton & Trạng Thái Rỗng (EmptyState)</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Skeleton width="60px" variant="cover" />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Skeleton width="80%" height="18px" />
            <Skeleton width="50%" height="14px" />
            <Skeleton width="30%" height="12px" />
          </div>
        </div>

        <EmptyState
          title="Chưa có sách nào ở đây"
          description="Hãy thêm sách từ bộ nhớ thiết bị hoặc tải về từ các nguồn yêu thích của bạn."
          actionLabel="Nhập tài liệu ngay"
          onAction={() => alert('Mở dialog nhập!')}
        />
      </section>

      {/* 6. Adobe Spectrum S2 Genuine Components Showcase */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>6. Adobe Spectrum S2 Genuine Components</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
          <Button variant="accent">Accent Button</Button>
          <Button variant="primary">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="negative">Negative Button</Button>
          <ActionButton>Action</ActionButton>
          <Avatar src="" alt="User" />
          <StatusLight variant="positive">Sẵn sàng</StatusLight>
        </div>

        <div style={{ maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <SearchField aria-label="Tìm kiếm Spectrum" placeholder="Tìm kiếm sách..." />
          <ToggleButtonGroup aria-label="Bộ lọc mẫu" defaultSelectedKeys={['all']} selectionMode="single">
            <ToggleButton id="all">Tất cả</ToggleButton>
            <ToggleButton id="reading">Đang đọc</ToggleButton>
            <ToggleButton id="finished">Đã đọc</ToggleButton>
          </ToggleButtonGroup>
          <Picker label="Sắp xếp theo" defaultSelectedKey="recent">
            <PickerItem id="recent">Mới mở gần đây</PickerItem>
            <PickerItem id="title">Tên sách (A-Z)</PickerItem>
            <PickerItem id="progress">Tiến độ đọc</PickerItem>
          </Picker>
          <ProgressBar label="Tiến độ đọc" value={65} />
          <Switch defaultSelected>Bật thông báo</Switch>
        </div>
      </section>

      <Sheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title="Thông Tin Tác Phẩm"
      >
        <div>
          <p style={{ margin: 0, lineHeight: 1.6, color: 'var(--text-primary)' }}>
            <strong>Truyện Kiều</strong> là một kiệt tác văn học trung đại Việt Nam của Nguyễn Du,
            được viết bằng chữ Nôm theo thể thơ lục bát, gồm 3.254 câu thơ.
          </p>
          <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={() => setIsSheetOpen(false)}
            >
              Bắt đầu đọc
            </button>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => setIsSheetOpen(false)}
            >
              Đóng lại
            </button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
