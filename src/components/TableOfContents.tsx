import { ArticleNavigator, type ArticleNavigatorProps } from './article/ArticleNavigator';

export function TableOfContents(props: ArticleNavigatorProps) {
  return <ArticleNavigator {...props} />;
}

export default TableOfContents;
